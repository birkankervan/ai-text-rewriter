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

export const LANGUAGE_TO_CODE: Record<string, string> = {
    "English": "en",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Italian": "it",
    "Portuguese": "pt",
    "Dutch": "nl",
    "Russian": "ru",
    "Chinese (Simplified)": "zh-CN",
    "Japanese": "ja",
    "Korean": "ko",
    "Arabic": "ar",
    "Hindi": "hi",
    "Turkish": "tr",
    "Greek": "el",
    "Hebrew": "he",
    "Swedish": "sv",
    "Polish": "pl",
    "Vietnamese": "vi",
    "Thai": "th",
    "Georgian": "ka"
}

export const PROVIDERS = [
    { id: "openrouter", name: "OpenRouter", description: "Many models through one key, including free ones.", keyUrl: "https://openrouter.ai/keys" },
    { id: "openai", name: "OpenAI", description: "GPT models directly from OpenAI.", keyUrl: "https://platform.openai.com/api-keys" },
    { id: "gemini", name: "Google Gemini", description: "Fast Flash models, strong at translation.", keyUrl: "https://aistudio.google.com/apikey" },
    { id: "groq", name: "Groq", description: "Very fast open-source models.", keyUrl: "https://console.groq.com/keys" }
] as const

export const DEFAULTS = {
    openrouter: "google/gemini-3.5-flash-lite",
    openai: "gpt-5.6-luna",
    gemini: "gemini-3.5-flash",
    groq: "llama-3.1-8b-instant"
} as const
