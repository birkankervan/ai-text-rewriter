import { useState, useRef, useCallback, useEffect } from "react"
import { storage } from "~lib/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { translationGateway } from "~services/translation-gateway"
import type { PromptOptions } from "~lib/prompt-utils"
import { runStreamRequest, type StreamState } from "./stream-request"

export function useStream() {
    const [state, setState] = useState<StreamState>({ status: 'idle' })
    const abortControllerRef = useRef<AbortController | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const stop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        // Transition to complete with current data
        setState(prev => {
            if (prev.status === 'streaming') {
                return { status: 'complete', data: prev.data }
            }
            return prev
        })
    }, [])

    const saveHistory = async (prompt: string, fullText: string, options: PromptOptions) => {
        // Determine actual provider used based on mode and preferences
        let provider: string
        let model: string

        if (options.mode === "translate") {
            // Check if free translation was used
            const preferredProvider = await storage.get("preferred_translation_provider") || "free"
            const activeProvider = await storage.get("active_provider") || "openrouter"
            const hasApiKey = await storage.get(`${activeProvider}_key`)

            // Use free if: preference is free OR (preference is AI but no key exists - fallback)
            if (preferredProvider === "free" || (preferredProvider === "ai" && !hasApiKey)) {
                provider = "Google Translate"
                model = "free"
            } else {
                provider = activeProvider
                model = await storage.get(`${activeProvider}_model`) || "default"
            }
        } else {
            // Rewrite mode always uses AI
            provider = await storage.get("active_provider") || "openrouter"
            model = await storage.get(`${provider}_model`) || "default"
        }

        const historyPayload = {
            type: options.mode,
            original: prompt,
            result: fullText,
            provider,
            model,
            rewriteOptions: options.mode === "rewrite" ? {
                tone: options.tone,
                fixGrammar: options.fixGrammar
            } : undefined,
            translateOptions: options.mode === "translate" ? {
                targetLang: options.targetLang
            } : undefined
        }

        const response = await sendToBackground({
            name: "save-history",
            body: historyPayload
        })
        if (response?.success === false) throw new Error(response.error || "Failed to save history")
    }

    const generate = useCallback((prompt: string, options: PromptOptions, autoSaveHistory: boolean = true) => runStreamRequest({
        activeRef: abortControllerRef,
        setState,
        // Use translation gateway instead of direct LLM service
        translate: (text, requestOptions) => translationGateway.translateText(text, requestOptions),
        saveHistory
    }, prompt, options, autoSaveHistory), [])

    const reset = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setState({ status: 'idle' })
    }, [])

    return {
        state,
        generate,
        stop,
        reset,
        // Derived states for convenience
        isLoading: state.status === 'streaming',
        isComplete: state.status === 'complete',
        isError: state.status === 'error',
        data: state.status === 'streaming' || state.status === 'complete' || state.status === 'error' ? state.data : '',
        error: state.status === 'error' ? state.error : null
    }
}
