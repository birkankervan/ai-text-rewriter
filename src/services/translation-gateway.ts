import { Storage } from "@plasmohq/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { llmService } from "./llm"
import type { TranslationProvider } from "~lib/llm-types"

const storage = new Storage()

/**
 * Translation Gateway Service
 * 
 * Acts as a single point of entry for all translation and rewrite requests.
 * Intelligently routes requests based on mode and user preferences.
 */

interface TranslateOptions {
    mode: "rewrite" | "translate"
    targetLang?: string
    tone?: string
    signal?: AbortSignal
}

interface FreeTranslationResult {
    success?: boolean
    translatedText?: string
    error?: string
}

export class TranslationGateway {
    /**
     * Main translation function with intelligent routing
     */
    async *translateText(
        text: string,
        options: TranslateOptions
    ): AsyncGenerator<string> {
        const { mode, targetLang, tone, signal } = options

        // RULE 1: Rewrite mode ALWAYS uses AI
        if (mode === "rewrite") {
            yield* this.useAIProvider(text, { mode, targetLang, tone, signal })
            return
        }

        // RULE 2: Translate mode - check user preference
        const preferredProvider = await storage.get("preferred_translation_provider") as TranslationProvider || "free"

        if (preferredProvider === "free") {
            // Use free Google Translate (non-streaming)
            const result = await this.useFreeTranslation(text, targetLang || "English")
            yield result
            return
        }

        // Preferred provider is AI - check if API key exists
        const activeProvider = await storage.get("active_provider") || "openrouter"
        const apiKey = await storage.get(`${activeProvider}_key`)

        if (apiKey) {
            // API key exists - use AI provider
            yield* this.useAIProvider(text, { mode, targetLang, tone, signal })
        } else {
            // API key missing - AUTOMATIC FALLBACK to free translation
            console.warn("AI provider selected but no API key found. Falling back to free translation.")
            this.notifyFallback()

            const result = await this.useFreeTranslation(text, targetLang || "English")
            yield result
        }
    }

    /**
     * Use AI provider (streaming response)
     */
    private async *useAIProvider(
        text: string,
        options: TranslateOptions
    ): AsyncGenerator<string> {
        const securePrompt = `<input>${text}</input>`

        yield* llmService.generateText(securePrompt, {
            mode: options.mode,
            targetLang: options.targetLang,
            tone: options.tone,
            signal: options.signal
        })
    }

    /**
     * Use free Google Translate (non-streaming)
     */
    private async useFreeTranslation(text: string, targetLang: string): Promise<string> {
        try {
            // Map language names to Google Translate language codes
            const langCodeMap: Record<string, string> = {
                "Keep Original": "auto",
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

            const targetCode = langCodeMap[targetLang] || "en"

            const response = await sendToBackground({
                name: "free-translate" as any,
                body: {
                    text,
                    to: targetCode
                }
            }) as FreeTranslationResult

            if (response.error) {
                throw new Error(response.error)
            }

            return response.translatedText || text
        } catch (error) {
            console.error("Free translation failed:", error)
            throw new Error(`Free translation failed: ${error.message}`)
        }
    }

    /**
     * Notify user about automatic fallback to free translation
     */
    private notifyFallback() {
        // Log for now - can be enhanced with toast notifications
        console.info("ℹ️ Using free translation (API key not configured)")

        // Future enhancement: Send message to content script to show toast
        // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        //     if (tabs[0]?.id) {
        //         chrome.tabs.sendMessage(tabs[0].id, {
        //             type: "SHOW_TOAST",
        //             message: "Using free translation (API key not configured)"
        //         })
        //     }
        // })
    }
}

export const translationGateway = new TranslationGateway()
