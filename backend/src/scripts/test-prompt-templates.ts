/**
 * Prompt template loading tests.
 *
 * Verifies template files, metadata, and placeholder rendering.
 * Does NOT invoke Gemini or run business logic.
 *
 * Run: npm run test:prompt-templates
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import {
  getPromptTemplateMetadata,
  getPromptTemplatesDirectory,
  listPromptTemplates,
  loadPromptTemplate,
  renderPromptTemplate,
  renderPromptTemplateByName,
} from '../ai';
import { NotFoundError } from '../utils/errors';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const assertRejects = async (
  action: () => Promise<unknown>,
  message: string,
): Promise<void> => {
  try {
    await action();
    throw new Error(`FAIL: ${message}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FAIL:')) {
      throw error;
    }
    assert(error instanceof NotFoundError, message);
  }
};

const testTemplateStructure = async (): Promise<void> => {
  console.log('\n--- Template structure ---');

  const templateNames = listPromptTemplates();
  assert(templateNames.length === 5, 'Five prompt templates are registered');

  for (const name of templateNames) {
    const metadata = getPromptTemplateMetadata(name);
    const systemPath = path.join(getPromptTemplatesDirectory(), name, `${metadata.version}.system.txt`);
    const userPath = path.join(
      getPromptTemplatesDirectory(),
      name,
      metadata.userTemplateFile ?? '',
    );

    await fs.access(systemPath);
    assert(true, `System template exists for ${name}`);

    if (metadata.userTemplateFile) {
      await fs.access(userPath);
      assert(true, `User template exists for ${name}`);
    }
  }
};

const testLoadTemplates = async (): Promise<void> => {
  console.log('\n--- Template loading ---');

  const extraction = await loadPromptTemplate('extraction');
  assert(extraction.id === 'information-extraction-agent', 'Extraction template exposes prompt ID');
  assert(extraction.version === 'v1', 'Extraction template exposes version');
  assert(
    extraction.system.includes('Information Extraction Agent'),
    'Extraction system prompt loads from file',
  );
  assert(Boolean(extraction.userTemplate), 'Extraction user template loads from file');

  const classification = await loadPromptTemplate('classification');
  assert(
    classification.system.includes('Classification Agent'),
    'Classification system prompt loads from file',
  );

  const validation = await loadPromptTemplate('validation');
  assert(validation.system.includes('Validation Agent'), 'Validation system prompt loads from file');

  const reportSummary = await loadPromptTemplate('report-summary');
  assert(
    reportSummary.system.includes('Report Summary Agent'),
    'Report summary system prompt loads from file',
  );

  const smartSearch = await loadPromptTemplate('smart-search');
  assert(
    smartSearch.system.includes('Smart Search Agent'),
    'Smart search system prompt loads from file',
  );
};

const testPlaceholderRendering = (): void => {
  console.log('\n--- Placeholder rendering ---');

  const rendered = renderPromptTemplate(
    'Group: {{groupName}}\nMessage:\n{{message}}',
    {
      groupName: 'Computer Department',
      message: 'Rahul Patil secured placement at Infosys.',
    },
  );

  assert(rendered.includes('Computer Department'), 'Group placeholder is rendered');
  assert(
    rendered.includes('Rahul Patil secured placement at Infosys.'),
    'Message placeholder is rendered',
  );
  assert(!rendered.includes('{{groupName}}'), 'Unresolved group placeholder is removed');
};

const testRenderByName = async (): Promise<void> => {
  console.log('\n--- Render by template name ---');

  const rendered = await renderPromptTemplateByName('smart-search', {
    query: 'Show all placements in Infosys.',
    department: 'Computer Department',
    collections: 'placements,internships',
  });

  assert(
    rendered.userPrompt.includes('Show all placements in Infosys.'),
    'Smart search query placeholder is rendered',
  );
  assert(
    rendered.userPrompt.includes('Computer Department'),
    'Smart search department placeholder is rendered',
  );
  assert(
    rendered.system.includes('Smart Search Agent'),
    'Smart search system prompt is returned with rendered user prompt',
  );
};

const testMissingTemplate = async (): Promise<void> => {
  console.log('\n--- Missing template handling ---');

  await assertRejects(
    () => loadPromptTemplate('extraction', 'v99'),
    'Missing template version throws NotFoundError',
  );
};

const runTests = async (): Promise<void> => {
  console.log('Running prompt template tests...');

  await testTemplateStructure();
  await testLoadTemplates();
  testPlaceholderRendering();
  await testRenderByName();
  await testMissingTemplate();

  console.log('\nAll prompt template tests passed.');
};

runTests().catch((error) => {
  console.error('\nPrompt template tests failed:', error);
  process.exit(1);
});
