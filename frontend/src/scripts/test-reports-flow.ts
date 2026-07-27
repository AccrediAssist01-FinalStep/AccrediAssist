/**
 * Reports Center API flow verification (mirrors frontend report.service).
 *
 * Run with backend running:
 *   npm run test:reports-flow
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const TEST_EMAIL = process.env.TEST_AUTH_EMAIL ?? 'admin@accrediassist.edu';
const TEST_PASSWORD = process.env.TEST_AUTH_PASSWORD ?? 'Admin@12345';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
};

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

const run = async (): Promise<void> => {
  console.log('Running Reports Center flow verification...\n');

  let token: string;
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    token = loginResponse.data.data.token;
    assert(Boolean(token), 'Login succeeds');
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      console.warn('SKIP: Backend not reachable — start backend to run live report tests');
      process.exit(0);
    }
    throw error;
  }

  const headers = authHeaders(token);

  try {
    await axios.get(`${API_BASE_URL}/reports`);
    throw new Error('Expected 401');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      assert(error.response?.status === 401, 'GET /reports rejects missing token');
    } else {
      throw error;
    }
  }

  const generated = await axios.post(
    `${API_BASE_URL}/reports/generate`,
    {
      reportType: 'Placement',
      format: 'pdf',
      academicYear: '2025-2026',
    },
    { headers, timeout: 120_000 },
  );
  assert(generated.status === 201, 'POST /reports/generate with format=pdf returns 201');
  const reportId = generated.data.data._id as string;
  assert(Boolean(reportId), 'Generate returns report ID');
  assert(generated.data.data.downloadReady === true, 'Generated report is download-ready');
  assert(generated.data.data.exportFormat === 'pdf', 'Report exportFormat is pdf');
  assert(generated.data.data.status === 'completed', 'Report status is completed');

  const list = await axios.get(`${API_BASE_URL}/reports`, {
    headers,
    params: { page: 1, limit: 10, format: 'pdf', status: 'completed' },
  });
  assert(list.status === 200, 'GET /reports with filters returns 200');
  assert(Array.isArray(list.data.data.items), 'List returns items array');

  const detail = await axios.get(`${API_BASE_URL}/reports/${reportId}`, { headers });
  assert(detail.status === 200, 'GET /reports/:id returns 200');
  assert(detail.data.data._id === reportId, 'Detail returns matching report');

  const downloadMeta = await axios.get(`${API_BASE_URL}/reports/${reportId}/download`, { headers });
  assert(downloadMeta.status === 200, 'GET /reports/:id/download returns metadata');
  assert(downloadMeta.data.data.contentType === 'application/pdf', 'Download metadata has PDF content type');

  const fileResponse = await axios.get(`${API_BASE_URL}/reports/download/${reportId}`, {
    headers,
    responseType: 'arraybuffer',
    timeout: 120_000,
  });
  assert(fileResponse.status === 200, 'GET /reports/download/:id streams file');
  assert(fileResponse.data.byteLength > 0, 'Downloaded file is non-empty');

  const docxGenerated = await axios.post(
    `${API_BASE_URL}/reports/generate`,
    {
      reportType: 'Internship',
      format: 'docx',
      academicYear: '2025-2026',
    },
    { headers, timeout: 120_000 },
  );
  assert(docxGenerated.status === 201, 'POST /reports/generate with format=docx returns 201');
  assert(docxGenerated.data.data.exportFormat === 'docx', 'DOCX report exportFormat is docx');

  const summary = await axios.post(
    `${API_BASE_URL}/report-generation/summary`,
    { reportType: 'Placement', filters: { academicYear: '2025-2026' } },
    { headers, timeout: 120_000 },
  );
  assert(summary.status === 200, 'POST /report-generation/summary returns 200');
  assert(Boolean(summary.data.data.summary?.executiveSummary), 'Summary includes executiveSummary');

  const charts = await axios.post(
    `${API_BASE_URL}/report-generation/charts`,
    { reportType: 'Placement', filters: { academicYear: '2025-2026' }, exportFormat: 'frontend' },
    { headers, timeout: 120_000 },
  );
  assert(charts.status === 200, 'POST /report-generation/charts returns 200');
  assert(Array.isArray(charts.data.data.charts), 'Charts response includes charts array');

  await axios.delete(`${API_BASE_URL}/reports/${reportId}`, { headers });
  assert(true, 'DELETE /reports/:id succeeds');

  try {
    await axios.get(`${API_BASE_URL}/reports/${reportId}`, { headers });
    throw new Error('Expected 404');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      assert(error.response?.status === 404, 'Deleted report returns 404');
    } else {
      throw error;
    }
  }

  console.log('\nAll Reports Center flow tests passed.');
};

run().catch((error) => {
  console.error('\nReports Center flow tests failed:', error);
  process.exit(1);
});
