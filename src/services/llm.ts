import { Storage } from "@plasmohq/storage"
import type { LLMRequestOptions } from "~lib/llm-types"
import { getSystemPrompt, getTemperature } from "~lib/prompt-utils"
import { API_ENDPOINTS, DEFAULTS } from "~lib/constants"

const storage = new Storage()

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
    const regex = /"text":\s*"((?:[^"\\]|\\.)*)"/g

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            let match
            let lastIndex = 0

            while ((match = regex.exec(buffer)) !== null) {
                try {
                    const text = JSON.parse(`"${match[1]}"`)
                    if (text) yield text
                    lastIndex = regex.lastIndex
                } catch (e) {
                    // Ignore parsing errors for individual chunks
                }
            }

            if (lastIndex > 0) buffer = buffer.slice(lastIndex)
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
            "HTTP-Referer": "https://github.com/PlasmoHQ/plasmo",
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
        getUrl: (model, apiKey) => `${API_ENDPOINTS.gemini.base}/${model}:streamGenerateContent?key=${apiKey}`,
        getHeaders: () => ({ "Content-Type": "application/json" }),
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

        const response = await fetch(strategy.getUrl(model, apiKey), {
            method: "POST",
            headers: strategy.getHeaders(apiKey),
            body: JSON.stringify(strategy.getBody(model, systemPrompt, prompt, temperature)),
            signal: options.signal
        })

        if (!response.ok) throw new Error(`${providerName.toUpperCase()} Error: ${response.statusText}`)
        yield* strategy.streamParser(response)
    }
}

export const llmService = new LLMService()
