import { createAbortSignal, ProviderError, withRetry } from './base';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const complete = async (prompt, opts) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new ProviderError('GROQ_API_KEY is not set');
    }
    const messages = [];
    if (prompt.system) {
        messages.push({ role: 'system', content: prompt.system });
    }
    messages.push({ role: 'user', content: prompt.user });
    const body = {
        model: opts.model,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.max_tokens ?? 2048,
        stream: false,
        messages
    };
    return withRetry(async () => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(body),
            signal: createAbortSignal(opts.timeoutMs)
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new ProviderError(`Groq request failed: ${response.status}`, errText, response.status);
        }
        const json = (await response.json());
        const choice = json.choices?.[0]?.message?.content;
        if (!choice) {
            throw new ProviderError('Groq response missing content', json, response.status);
        }
        return {
            id: json.id ?? 'groq-response',
            model: json.model ?? opts.model,
            content: choice,
            usage: json.usage
        };
    });
};
