import path from 'path';
import { env } from '../../config/env';

export const getPromptTemplatesDirectory = (): string =>
  path.resolve(process.cwd(), env.AI_TEMPLATES_PATH);
