import { ValidationAgentResponse, ValidationInput } from '../interfaces/validation.interface';
import { GeminiProvider, geminiProvider } from '../providers/gemini.provider';
import { normalizeValidationResult } from '../utils/validation-result.util';
import { renderPromptTemplateByName } from '../utils/prompt-template.util';

export class ValidationAgent {
  constructor(private readonly provider: GeminiProvider = geminiProvider) {}

  async validate(input: ValidationInput): Promise<ValidationAgentResponse> {
    const renderedPrompt = await renderPromptTemplateByName('validation', {
      category: input.category,
      extractedData: JSON.stringify(input.extractedData, null, 2),
      message: input.originalMessage ?? 'none',
      existingTitles:
        input.existingTitles && input.existingTitles.length > 0
          ? input.existingTitles.join('\n')
          : 'none',
    });

    const response = await this.provider.generateJSON<Record<string, unknown>>({
      prompt: renderedPrompt.userPrompt,
      systemInstruction: renderedPrompt.system,
      temperature: 0.1,
    });

    return {
      result: normalizeValidationResult(response.data),
      model: response.model,
      provider: 'gemini',
    };
  }
}

export const validationAgent = new ValidationAgent();
