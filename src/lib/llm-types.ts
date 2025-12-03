import type { PromptOptions } from "~lib/prompt-utils"

export interface LLMRequestOptions extends PromptOptions {
    signal?: AbortSignal
}

export type TranslationProvider = "ai" | "free"

export interface TranslationGatewayOptions {
    mode: "rewrite" | "translate"
    targetLang?: string
    tone?: string
    signal?: AbortSignal
}

export type TranslationResult =
    | { type: "streaming", stream: AsyncGenerator<string> }
    | { type: "single", result: string }

export interface LLMRequestBody {
    prompt: string
    options: Omit<LLMRequestOptions, "signal"> // Signal cannot be serialized
}

export interface LLMResponseBody {
    chunk?: string
    done?: boolean
    error?: string
}
