import { createAbortSignal, ProviderError, type ProviderFn, withRetry } from './base';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export const complete: ProviderFn = async (prompt, opts) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ProviderError('ANTHROPIC_API_KEY is not set');
  }

  const body = {
    model: opts.model,
    max_tokens: opts.max_tokens ?? 2048,
    temperature: opts.temperature ?? 0.2,
    system: prompt.system,
    messages: [
      {
        role: 'user',
        content: prompt.user
      }
    ]
  };

  return withRetry(async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION
      },
      body: JSON.stringify(body),
      signal: createAbortSignal(opts.timeoutMs)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new ProviderError(`Claude request failed: ${response.status}`, errText, response.status);
    }

    const json = (await response.json()) as any;
    const combined = Array.isArray(json.content)
      ? json.content
          .map((item: any) => (typeof item?.text === 'string' ? item.text : ''))
          .join('')
          .trim()
      : '';

    if (!combined) {
      throw new ProviderError('Claude response missing content', json, response.status);
    }

    return {
      id: json.id ?? 'claude-response',
      model: json.model ?? opts.model,
      content: combined,
      usage: json.usage
    };
  });
};
