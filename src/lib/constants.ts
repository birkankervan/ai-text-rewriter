export const SUPPORTED_LANGUAGES = [
    "Keep Original",
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Dutch",
    "Russian",
    "Chinese (Simplified)",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Turkish",
    "Greek",
    "Hebrew",
    "Swedish",
    "Polish",
    "Vietnamese",
    "Thai",
    "Georgian"
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const TONES = ["Professional", "Friendly", "Formal", "Casual", "Concise", "Expanded"] as const
export type Tone = typeof TONES[number]

export const API_ENDPOINTS = {
    openrouter: {
        chat: "https://openrouter.ai/api/v1/chat/completions",
        models: "https://openrouter.ai/api/v1/models"
    },
    openai: {
        chat: "https://api.openai.com/v1/chat/completions",
        models: "https://api.openai.com/v1/models"
    },
    gemini: {
        base: "https://generativelanguage.googleapis.com/v1beta/models"
    },
    groq: {
        chat: "https://api.groq.com/openai/v1/chat/completions",
        models: "https://api.groq.com/openai/v1/models"
    }
} as const
