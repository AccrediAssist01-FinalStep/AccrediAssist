/**
 * Report Template System tests.
 *
 * Run: npm run test:report-templates
 */

import dotenv from 'dotenv';
import { GENERATION_REPORT_TYPES } from '../report-generation/config/report-types.config';
import {
  REPORT_TEMPLATE_DEFINITIONS,
  REPORT_TEMPLATE_SECTION_KEYS,
  INSTITUTIONAL_THEME,
  templateBuilder,
  templateService,
} from '../report-generation/template-system';

dotenv.config();

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const runTests = async (): Promise<void> => {
  console.log('Running Report Template System tests...\n');

  assert(
    GENERATION_REPORT_TYPES.length === 10,
    `All 10 report types registered (${GENERATION_REPORT_TYPES.length})`,
  );

  assert(
    Object.keys(REPORT_TEMPLATE_DEFINITIONS).length === 10,
    'Template definitions exist for all report types',
  );

  for (const reportType of GENERATION_REPORT_TYPES) {
    const definition = REPORT_TEMPLATE_DEFINITIONS[reportType];
    assert(definition.templateId.length > 0, `${reportType}: templateId is set`);
    assert(definition.label.length > 0, `${reportType}: label is set`);
    assert(definition.sections.length === REPORT_TEMPLATE_SECTION_KEYS.length, `${reportType}: has all canonical sections`);
    assert(definition.theme.primaryColor === INSTITUTIONAL_THEME.primaryColor, `${reportType}: uses institutional primary color`);
    assert(definition.defaultLayout.header.length > 0, `${reportType}: header configured`);
    assert(definition.defaultLayout.footer.length > 0, `${reportType}: footer configured`);
  }

  const validation = templateService.validateAllTemplates();
  assert(validation.valid, `All templates validate (${validation.errors.join('; ') || 'no errors'})`);

  const list = templateService.listTemplates();
  assert(list.length === 10, 'Template service lists all templates');

  const resolved = templateBuilder.build({
    reportType: 'NBA',
    academicYear: '2025-2026',
    department: 'Computer Engineering',
    overrides: {
      branding: {
        collegeName: 'Test Engineering College',
        address: '123 Campus Road, Pune',
      },
      layout: {
        showWatermark: true,
        watermark: 'DRAFT',
      },
    },
  });

  assert(resolved.branding.collegeName === 'Test Engineering College', 'Branding override applied');
  assert(resolved.branding.academicYear === '2025-2026', 'Academic year applied');
  assert(resolved.branding.department === 'Computer Engineering', 'Department applied');
  assert(resolved.layout.showWatermark === true, 'Watermark flag applied');
  assert(resolved.layout.watermark === 'DRAFT', 'Watermark text applied');
  assert(resolved.enabledSectionKeys.includes('executive-summary'), 'Executive summary section enabled');
  assert(resolved.enabledSectionKeys.includes('charts'), 'Charts section enabled');
  assert(resolved.enabledSectionKeys[0] === 'cover', 'Cover page is first section');

  const disabled = templateBuilder.build({
    reportType: 'Placement',
    overrides: {
      disabledSections: ['images', 'appendix'],
    },
  });
  assert(!disabled.enabledSectionKeys.includes('images'), 'Disabled sections excluded');
  assert(!disabled.enabledSectionKeys.includes('appendix'), 'Appendix can be disabled');
  assert(disabled.enabledSectionKeys.includes('statistics'), 'Other sections remain enabled');

  const accreditationTemplates = list.filter((item) => item.category === 'accreditation');
  assert(accreditationTemplates.length === 3, 'Three accreditation templates (NBA, NAAC, AICTE)');

  console.log('\nAll report template system tests passed.');
};

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
