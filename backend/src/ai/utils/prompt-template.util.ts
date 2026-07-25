import fs from 'fs/promises';
import path from 'path';
import { NotFoundError } from '../../utils/errors';
import {
  PromptTemplate,
  PromptTemplateMetadata,
  PromptTemplateName,
  PromptTemplateVariables,
} from '../interfaces/prompt-template.interface';
import { getPromptTemplatesDirectory } from './prompt-template-config.util';

const PROMPT_METADATA: Record<PromptTemplateName, PromptTemplateMetadata> = {
  extraction: {
    id: 'information-extraction-agent',
    name: 'extraction',
    version: 'v1',
    lastUpdated: '2026-07-25',
    userTemplateFile: 'v1.user.template.txt',
  },
  classification: {
    id: 'classification-agent',
    name: 'classification',
    version: 'v1',
    lastUpdated: '2026-07-25',
    userTemplateFile: 'v1.user.template.txt',
  },
  validation: {
    id: 'validation-agent',
    name: 'validation',
    version: 'v1',
    lastUpdated: '2026-07-25',
    userTemplateFile: 'v1.user.template.txt',
  },
  'report-summary': {
    id: 'report-summary-agent',
    name: 'report-summary',
    version: 'v1',
    lastUpdated: '2026-07-25',
    userTemplateFile: 'v1.user.template.txt',
  },
  'smart-search': {
    id: 'smart-search-agent',
    name: 'smart-search',
    version: 'v1',
    lastUpdated: '2026-07-25',
    userTemplateFile: 'v1.user.template.txt',
  },
};

const readTemplateFile = async (filePath: string): Promise<string> => {
  try {
    return (await fs.readFile(filePath, 'utf8')).trim();
  } catch {
    throw new NotFoundError(`Prompt template file not found: ${filePath}`);
  }
};

export const renderPromptTemplate = (
  template: string,
  variables: PromptTemplateVariables = {},
): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key] ?? '');

export const listPromptTemplates = (): PromptTemplateName[] =>
  Object.keys(PROMPT_METADATA) as PromptTemplateName[];

export const getPromptTemplateMetadata = (
  name: PromptTemplateName,
): PromptTemplateMetadata => PROMPT_METADATA[name];

export const loadPromptTemplate = async (
  name: PromptTemplateName,
  version = 'v1',
): Promise<PromptTemplate> => {
  const metadata = PROMPT_METADATA[name];

  if (!metadata) {
    throw new NotFoundError(`Prompt template not registered: ${name}`);
  }

  const templateDirectory = path.join(getPromptTemplatesDirectory(), name);
  const systemPath = path.join(templateDirectory, `${version}.system.txt`);
  const system = await readTemplateFile(systemPath);

  let userTemplate: string | undefined;

  if (metadata.userTemplateFile) {
    userTemplate = await readTemplateFile(path.join(templateDirectory, metadata.userTemplateFile));
  }

  return {
    id: metadata.id,
    name: metadata.name,
    version: metadata.version,
    lastUpdated: metadata.lastUpdated,
    system,
    userTemplate,
  };
};

export const renderPromptTemplateByName = async (
  name: PromptTemplateName,
  variables: PromptTemplateVariables,
  version = 'v1',
): Promise<{ system: string; userPrompt: string }> => {
  const template = await loadPromptTemplate(name, version);
  const userPrompt = template.userTemplate
    ? renderPromptTemplate(template.userTemplate, variables)
    : renderPromptTemplate('{{input}}', variables);

  return {
    system: template.system,
    userPrompt,
  };
};
