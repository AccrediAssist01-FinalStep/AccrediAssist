/**
 * Validates the eight-report ERP module configuration and generation endpoints.
 *
 * Run: npx tsx src/scripts/test-eight-reports.ts
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';
import { getReportSectionDefinitions } from '../report-generation/config/report-sections.config';

const EXPECTED_DASHBOARD_TITLES = [
  'Student Activities Report',
  'Faculty Activities Report',
  'Department Activities Report',
  'NBA Report',
  'NAAC Report',
  'AICTE Report',
  'Workshop Report',
  'Industrial Visit Report',
];

dotenv.config();

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000/api/v1';

const results: Array<{ check: string; pass: boolean; detail?: string }> = [];

const assert = (check: string, pass: boolean, detail?: string): void => {
  results.push({ check, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${check}${detail ? ` — ${detail}` : ''}`);
};

const request = async (
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, body: payload };
};

const main = async (): Promise<void> => {
  console.log('=== Eight Report Module Validation ===\n');

  assert('Backend defines exactly 8 generation report types', GENERATION_REPORT_TYPES.length === 8, GENERATION_REPORT_TYPES.join(', '));
  assert('Dashboard card titles defined (8)', EXPECTED_DASHBOARD_TITLES.length === 8, EXPECTED_DASHBOARD_TITLES.join(', '));

  const studentSections = getReportSectionDefinitions('Student Activities');
  const facultySections = getReportSectionDefinitions('Faculty Activities');
  const departmentSections = getReportSectionDefinitions('Department Activities');

  assert('Student Activities has sectioned layout', studentSections.length >= 10, `${studentSections.length} sections`);
  assert('Faculty Activities has sectioned layout', facultySections.length >= 10, `${facultySections.length} sections`);
  assert('Department Activities has sectioned layout', departmentSections.length >= 5, `${departmentSections.length} sections`);
  assert('Workshop report has dedicated section', getReportSectionDefinitions('AI Generated Workshop').length === 1);
  assert('Industrial Visit report has dedicated section', getReportSectionDefinitions('AI Generated Industrial Visit').length === 1);

  await connectDatabase();

  const login = await request('POST', '/auth/login', {
    email: 'admin@accrediassist.edu',
    password: 'Admin@12345',
  });

  assert('Admin login succeeds', login.status === 200);
  const token = (login.body.data as { token?: string } | undefined)?.token;

  if (token) {
    const types = await request('GET', '/report-generation/types', undefined, token);
    assert('Report generation types endpoint returns 200', types.status === 200);
    const supported = Array.isArray(types.body.data)
      ? (types.body.data as Array<{ id: string }>).map((item) => item.id)
      : [];
    assert('Generation API exposes 8 report types', supported.length === 8, supported.join(', '));

    for (const reportType of GENERATION_REPORT_TYPES) {
      const aggregate = await request(
        'POST',
        '/report-generation/aggregate',
        {
          reportType,
          filters: { academicYear: '2025-2026' },
        },
        token,
      );
      assert(`${reportType} aggregation`, aggregate.status === 200);
    }
  } else {
    assert('Admin login succeeds', false, 'Missing token — API tests skipped');
  }

  await disconnectDatabase();

  const passed = results.filter((item) => item.pass).length;
  const failed = results.filter((item) => !item.pass);
  const completion = Math.round((passed / results.length) * 100);

  console.log('\n=== Summary ===');
  console.log(`Total checks: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Completion: ${completion}%`);

  if (failed.length > 0) {
    console.log('\nErrors Found:');
    failed.forEach((item) => console.log(`- ${item.check}${item.detail ? `: ${item.detail}` : ''}`));
    process.exit(1);
  }

  console.log('\nFinal Result: PASS');
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
