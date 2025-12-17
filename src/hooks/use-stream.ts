import { useState, useRef, useCallback, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { translationGateway } from "~services/translation-gateway"
import type { PromptOptions } from "~lib/prompt-utils"

// State machine types
type StreamState =
    | { status: 'idle' }
    | { status: 'streaming', data: string }
    | { status: 'complete', data: string }
    | { status: 'error', error: string, data: string }

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
        const storage = new Storage()
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
                tone: options.tone
            } : undefined,
            translateOptions: options.mode === "translate" ? {
                targetLang: options.targetLang
            } : undefined
        }

        await sendToBackground({
            name: "save-history",
            body: historyPayload
        })
    }

    const generate = useCallback(async (prompt: string, options: PromptOptions, autoSaveHistory: boolean = true) => {
        // Stop any ongoing generation
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new abort controller
        const controller = new AbortController()
        abortControllerRef.current = controller

        // Transition to streaming state
        setState({ status: 'streaming', data: '' })

        try {
            // Use translation gateway instead of direct LLM service
            const stream = translationGateway.translateText(prompt, {
                mode: options.mode,
                targetLang: options.targetLang,
                tone: options.tone,
                signal: controller.signal
            })

            let fullText = ''
            for await (const chunk of stream) {
                // Check if aborted
                if (controller.signal.aborted) {
                    break
                }

                fullText += chunk
                // Update state with new chunk
                setState({ status: 'streaming', data: fullText })
            }

            // Stream completed successfully
            setState({ status: 'complete', data: fullText })

            // Save history if requested
            if (autoSaveHistory && fullText) {
                await saveHistory(prompt, fullText, options)
            }
        } catch (err: any) {
            // Handle abort vs actual errors
            if (err.name === 'AbortError') {
                // User cancelled - transition to complete with what we have
                setState(prev => ({
                    status: 'complete',
                    data: prev.status === 'streaming' ? prev.data : ''
                }))
            } else {
                // Actual error - transition to error state
                setState(prev => ({
                    status: 'error',
                    error: err.message || 'An error occurred',
                    data: prev.status === 'streaming' ? prev.data : ''
                }))
            }
        } finally {
            // Always cleanup
            abortControllerRef.current = null
        }
    }, [])

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
