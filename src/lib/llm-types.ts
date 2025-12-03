import type { PromptOptions } from "~lib/prompt-utils"

export interface LLMRequestOptions extends PromptOptions {
    signal?: AbortSignal
}



export interface LLMRequestBody {
    prompt: string
    options: Omit<LLMRequestOptions, "signal"> // Signal cannot be serialized
}

export interface LLMResponseBody {
    chunk?: string
    done?: boolean
    error?: string
}
