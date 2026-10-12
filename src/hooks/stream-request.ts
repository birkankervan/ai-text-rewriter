import type { PromptOptions } from "~lib/prompt-utils"

// State machine types
export type StreamState =
    | { status: 'idle' }
    | { status: 'streaming', data: string }
    | { status: 'complete', data: string }
    | { status: 'error', error: string, data: string }

export interface StreamRequestDeps {
    // The active request; a request whose controller is no longer here is stale
    activeRef: { current: AbortController | null }
    setState: (next: StreamState | ((prev: StreamState) => StreamState)) => void
    translate: (prompt: string, options: PromptOptions & { signal: AbortSignal }) => AsyncIterable<string>
    saveHistory: (prompt: string, fullText: string, options: PromptOptions) => Promise<void>
}

// Request lifecycle behind useStream().generate, kept free of React and extension APIs
export async function runStreamRequest(deps: StreamRequestDeps, prompt: string, options: PromptOptions, autoSaveHistory: boolean = true) {
    const { activeRef, setState } = deps

    // Stop any ongoing generation
    if (activeRef.current) {
        activeRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    activeRef.current = controller

    // Transition to streaming state
    setState({ status: 'streaming', data: '' })

    try {
        const stream = deps.translate(prompt, {
            mode: options.mode,
            targetLang: options.targetLang,
            tone: options.tone,
            fixGrammar: options.fixGrammar,
            signal: controller.signal
        })

        let fullText = ''
        for await (const chunk of stream) {
            // Check if aborted
            if (controller.signal.aborted) {
                break
            }

            fullText += chunk
            if (activeRef.current === controller) {
                setState({ status: 'streaming', data: fullText })
            }
        }

        if (activeRef.current !== controller) return
        setState({ status: 'complete', data: fullText })

        if (autoSaveHistory && fullText) {
            try {
                await deps.saveHistory(prompt, fullText, options)
            } catch (error) {
                console.error("Failed to save history:", error)
            }
        }
    } catch (err: any) {
        if (activeRef.current !== controller) return
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
        if (activeRef.current === controller) {
            activeRef.current = null
        }
    }
}
