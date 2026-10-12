import { storage } from "~lib/storage"
import type { LLMRequestOptions } from "~lib/llm-types"
import { getSystemPrompt, getTemperature } from "~lib/prompt-utils"
import { API_ENDPOINTS, DEFAULTS } from "~lib/constants"

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
    const onAbort = () => {
        clearTimeout(timeout)
        reject(new DOMException("The operation was aborted", "AbortError"))
    }
    const timeout = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort)
        resolve()
    }, ms)
    signal?.addEventListener("abort", onAbort, { once: true })
})

// --- Stream Parsers ---

async function* streamSSE(response: Response): AsyncGenerator<string> {
    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")
    const decoder = new TextDecoder()
    let buffer = ""

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) continue

                // Terminate stream when [DONE] is received
                if (trimmed === "data: [DONE]") {
                    return
                }

                if (trimmed.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(trimmed.slice(6))
                        const content = data.choices?.[0]?.delta?.content
                        if (content) yield content
                    } catch (e) {
                        // Ignore parsing errors for individual chunks
                    }
                }
            }
        }
    } finally {
        // Always release the reader
        reader.releaseLock()
    }
}

async function* streamGemini(response: Response): AsyncGenerator<string> {
    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")
    const decoder = new TextDecoder()
    let buffer = ""

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed.startsWith("data:")) continue

                try {
                    const data = JSON.parse(trimmed.slice(5).trim())
                    for (const candidate of data.candidates || []) {
                        for (const part of candidate.content?.parts || []) {
                            if (typeof part.text === "string" && !part.thought) yield part.text
                        }
                    }
                } catch {
                    // Ignore parsing errors for individual chunks
                }
            }
        }
    } finally {
        // Always release the reader
        reader.releaseLock()
    }
}

// --- Provider Strategies ---

interface ProviderStrategy {
    getUrl(model: string, apiKey: string): string
    getHeaders(apiKey: string): Record<string, string>
    getBody(model: string, systemPrompt: string, userPrompt: string, temperature: number): any
    streamParser(response: Response): AsyncGenerator<string>
}

const strategies: Record<string, ProviderStrategy> = {
    openrouter: {
        getUrl: () => API_ENDPOINTS.openrouter.chat,
        getHeaders: (apiKey) => ({
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://birkankervan.github.io/ai-text-rewriter/",
            "X-Title": "Smart Translate & Rewrite",
            "Content-Type": "application/json"
        }),
        getBody: (model, systemPrompt, userPrompt, temperature) => ({
            model,
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature,
            stream: true
        }),
        streamParser: streamSSE
    },
    openai: {
        getUrl: () => API_ENDPOINTS.openai.chat,
        getHeaders: (apiKey) => ({
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }),
        getBody: (model, systemPrompt, userPrompt, temperature) => ({
            model,
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature,
            stream: true
        }),
        streamParser: streamSSE
    },
    groq: {
        getUrl: () => API_ENDPOINTS.groq.chat,
        getHeaders: (apiKey) => ({
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }),
        getBody: (model, systemPrompt, userPrompt, temperature) => ({
            model,
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature,
            stream: true
        }),
        streamParser: streamSSE
    },
    gemini: {
        getUrl: (model) => `${API_ENDPOINTS.gemini.base}/${model}:streamGenerateContent?alt=sse`,
        getHeaders: (apiKey) => ({
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
        }),
        getBody: (_, systemPrompt, userPrompt) => ({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Input: ${userPrompt}` }] }]
        }),
        streamParser: streamGemini
    }
}

// --- Service ---

export class LLMService {
    async *generateText(prompt: string, options: LLMRequestOptions): AsyncGenerator<string> {
        const providerName = await storage.get("active_provider") || "openrouter"
        const apiKey = await storage.get(`${providerName}_key`)

        if (!apiKey) throw new Error("MISSING_API_KEY")

        const strategy = strategies[providerName]
        if (!strategy) throw new Error(`Unsupported provider: ${providerName}`)

        const modelKey = `${providerName}_model`
        const model = await storage.get(modelKey) || DEFAULTS[providerName as keyof typeof DEFAULTS]

        const systemPrompt = getSystemPrompt(options)
        const temperature = getTemperature(options.mode)

        const request = () => fetch(strategy.getUrl(model, apiKey), {
            method: "POST",
            headers: strategy.getHeaders(apiKey),
            body: JSON.stringify(strategy.getBody(model, systemPrompt, prompt, temperature)),
            signal: options.signal
        })

        let response = await request()
        if (providerName === "gemini") {
            for (let attempt = 0; response.status === 503 && attempt < 2; attempt++) {
                await response.body?.cancel()
                await wait((2 ** attempt * 1000) + Math.random() * 250, options.signal)
                response = await request()
            }
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null)
            const detail = errorBody?.error?.message || `${response.status} ${response.statusText}`
            throw new Error(`${providerName.toUpperCase()} Error: ${detail}`)
        }
        yield* strategy.streamParser(response)
    }
}

export const llmService = new LLMService()
