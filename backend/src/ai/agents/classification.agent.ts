import { ClassificationAgentResponse, ClassificationInput } from '../interfaces/classification.interface';
import { GeminiProvider, geminiProvider } from '../providers/gemini.provider';
import { normalizeClassificationResult } from '../utils/classification-result.util';
import { renderPromptTemplateByName } from '../utils/prompt-template.util';

export class ClassificationAgent {
  constructor(private readonly provider: GeminiProvider = geminiProvider) {}

  async classify(input: ClassificationInput): Promise<ClassificationAgentResponse> {
    const extractedData = JSON.stringify(input.extractedData, null, 2);
    const categoryHint =
      typeof input.extractedData.categoryHint === 'string'
        ? input.extractedData.categoryHint
        : 'none';

    const renderedPrompt = await renderPromptTemplateByName('classification', {
      extractedData,
      message: input.originalMessage ?? 'none',
      categoryHint,
    });

    const response = await this.provider.generateJSON<Record<string, unknown>>({
      prompt: renderedPrompt.userPrompt,
      systemInstruction: renderedPrompt.system,
      temperature: 0.1,
    });

    return {
      result: normalizeClassificationResult(response.data),
      model: response.model,
      provider: 'gemini',
    };
  }
}

export const classificationAgent = new ClassificationAgent();
