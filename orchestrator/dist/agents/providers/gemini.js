import { createAbortSignal, ProviderError, withRetry } from './base';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
export const complete = async (prompt, opts) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new ProviderError('GOOGLE_API_KEY is not set');
    }
    const url = `${API_ROOT}/${opts.model}:generateContent?key=${apiKey}`;
    const body = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt.user
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: opts.temperature ?? 0.2,
            maxOutputTokens: opts.max_tokens ?? 2048
        }
    };
    if (prompt.system) {
        body.systemInstruction = {
            role: 'system',
            parts: [
                {
                    text: prompt.system
                }
            ]
        };
    }
    return withRetry(async () => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            signal: createAbortSignal(opts.timeoutMs)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new ProviderError(`Gemini request failed: ${response.status}`, errText, response.status);
        }
        const json = (await response.json());
        const text = json.candidates?.[0]?.content?.parts
            ?.map((part) => (typeof part?.text === 'string' ? part.text : ''))
            .join('')
            .trim();
        if (!text) {
            throw new ProviderError('Gemini response missing content', json, response.status);
        }
        return {
            id: json.candidates?.[0]?.id ?? 'gemini-response',
            model: opts.model,
            content: text,
            usage: json.usage
        };
    });
};
