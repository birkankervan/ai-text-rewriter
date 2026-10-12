import { Bot, Check, ChevronDown, Copy, Globe, Lock, Zap } from "lucide-react"
import { onActivate } from "~lib/a11y"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLLM } from "~hooks/use-llm"
import { LANGUAGE_TO_CODE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "~lib/constants"
import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { ErrorState } from "./components/error-state"
import { SegmentedControl } from "~components/ui/segmented-control"

// Mock hook for free translation to match useLLM signature
// Keeps the component logic unified
const useFreeTranslate = () => {
    const [state, setState] = useState<{
        isLoading: boolean
        data: string
        error: string | null
    }>({
        isLoading: false,
        data: "",
        error: null
    })

    const generate = useCallback(async (text: string, targetLang: SupportedLanguage) => {
        setState({ isLoading: true, data: "", error: null })
        try {
            const langCode = LANGUAGE_TO_CODE[targetLang]
            if (!langCode) throw new Error("Language not supported in Free mode")

            const resp = await sendToBackground({
                name: "free-translate",
                body: {
                    text,
                    to: langCode
                }
            })

            if (resp.error) throw new Error(resp.error)
            setState({ isLoading: false, data: resp.translatedText, error: null })
        } catch (err: any) {
            setState({ isLoading: false, data: "", error: err.message || "Translation failed" })
        }
    }, [])

    return {
        ...state,
        generate
    }
}

interface TranslatePopupViewProps {
    apiKey: string | null
    defaultTargetLang: SupportedLanguage
    embedded?: boolean
}

export const TranslatePopupView = ({
    apiKey,
    defaultTargetLang,
    embedded = false
}: TranslatePopupViewProps) => {
    const [inputText, setInputText] = useState("")
    const [targetLang, setTargetLang] = useState<SupportedLanguage>(defaultTargetLang)
    const [mode, setMode] = useState<"ai" | "free">("free")
    const [isCopied, setIsCopied] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Hooks for both modes
    const { generate: generateAI, isLoading: isAILoading, error: aiError, data: aiData } = useLLM()
    const { generate: generateFree, isLoading: isFreeLoading, error: freeError, data: freeResult } = useFreeTranslate()

    // Unified state derivation
    const isLoading = mode === "ai" ? isAILoading : isFreeLoading
    const error = mode === "ai" ? aiError : freeError
    const result = mode === "ai" ? aiData : freeResult

    // Optimize Textarea Auto-resize
    // Use layout effect or strict updated ref logic to prevent jitter
    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setInputText(val)

        // Resize logic encapsulated here to avoid useEffect overhead
        const el = e.target
        el.style.height = "auto"
        el.style.height = `${el.scrollHeight}px`
    }, [])

    // Initial resize sync (still needed for initial content)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [inputText]) // Keep dependent on inputText for external updates (e.g. paste)

    // Default to the stored provider preference; fall back to free without an API key
    useEffect(() => {
        new Storage().get("preferred_translation_provider").then((stored) => {
            setMode(stored === "ai" && apiKey ? "ai" : "free")
        })
    }, [apiKey])

    // Sync default lang
    useEffect(() => {
        if (defaultTargetLang) {
            setTargetLang(defaultTargetLang)
        }
    }, [defaultTargetLang])

    const handleTranslate = useCallback(async () => {
        if (!inputText.trim()) return

        if (mode === "ai") {
            if (!apiKey) return
            generateAI(inputText, { mode: "translate", targetLang })
        } else {
            generateFree(inputText, targetLang)
        }
    }, [inputText, mode, apiKey, targetLang, generateAI, generateFree])

    const handleCopy = useCallback(() => {
        if (!result || isLoading) return
        navigator.clipboard.writeText(result)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }, [result, isLoading])

    // Memoize language options to prevent re-renders of the list
    const languageOptions = useMemo(() => (
        SUPPORTED_LANGUAGES.filter(l => l !== "Keep Original").map(lang => (
            <option key={lang} value={lang} className="plasmo-text-black">
                {lang}
            </option>
        ))
    ), [])

    return (
        <div className={`apple-theme plasmo-flex plasmo-flex-col plasmo-gap-3 ${embedded ? "" : "apple-card plasmo-p-3"}`}>
            {/* Input Area */}
            <div className="plasmo-relative plasmo-group">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInput}
                    className="apple-field plasmo-w-full plasmo-p-3 plasmo-resize-none plasmo-transition-all plasmo-text-[13px] plasmo-leading-relaxed"
                    rows={3}
                    placeholder="Enter text to translate..."
                />
            </div>

            {/* Controls Row */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-2">
                <div className="plasmo-flex plasmo-gap-2 plasmo-items-center">
                    {/* Language Selector */}
                    <div className="plasmo-relative plasmo-flex-1">
                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
                            disabled={isLoading}
                            className="apple-field plasmo-w-full plasmo-h-10 plasmo-text-xs plasmo-font-semibold plasmo-px-3 plasmo-appearance-none plasmo-transition-all plasmo-cursor-pointer disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
                            {languageOptions}
                        </select>
                        <div className="plasmo-absolute plasmo-right-2 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-pointer-events-none">
                            <ChevronDown className="apple-muted plasmo-w-3 plasmo-h-3" />
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <SegmentedControl<"ai" | "free">
                        ariaLabel="Translation service"
                        value={mode}
                        onChange={setMode}
                        className="plasmo-w-[132px]"
                        options={[
                            {
                                value: "ai",
                                disabled: isLoading || !apiKey,
                                title: !apiKey ? "Add API key in settings to use AI" : "Use AI for high-quality translation",
                                label: <span className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1">{apiKey ? <Bot className="plasmo-w-3 plasmo-h-3" /> : <Lock className="plasmo-w-3 plasmo-h-3" />} AI</span>
                            },
                            {
                                value: "free",
                                disabled: isLoading,
                                label: <span className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1"><Zap className="plasmo-w-3 plasmo-h-3" /> Free</span>
                            }
                        ]}
                    />
                </div>

                {/* Translate Button */}
                <button
                    onClick={handleTranslate}
                    disabled={isLoading || !inputText.trim() || (mode === "ai" && !apiKey)}
                    className="apple-primary plasmo-w-full plasmo-py-2 plasmo-text-xs plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
                    {isLoading ? (
                        <div className="plasmo-w-4 plasmo-h-4 plasmo-border-2 plasmo-border-white/30 plasmo-border-t-white plasmo-rounded-full plasmo-animate-spin" />
                    ) : (
                        <>
                            <Globe className="plasmo-w-3.5 plasmo-h-3.5" />
                            Translate
                        </>
                    )}
                </button>

                {mode === "ai" && !apiKey && (
                    <p className="plasmo-text-[10px] plasmo-text-red-400 plasmo-text-center">
                        API Key required for AI mode. Check settings.
                    </p>
                )}

                {/* Hint */}
                <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-mt-1">
                    <p className="apple-muted plasmo-text-[11px] plasmo-font-medium">
                        Only translates text. No rewriting or style changes applied.
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && <ErrorState error={error} onRetry={handleTranslate} />}

            {/* Result Area */}
            {(result || isLoading) && !error && (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Copy result"
                    onClick={handleCopy}
                    onKeyDown={onActivate(handleCopy)}
                    className={`apple-result plasmo-relative plasmo-p-3 plasmo-rounded-xl plasmo-transition-colors plasmo-group plasmo-mt-1 ${isLoading ? "plasmo-cursor-wait" : "plasmo-cursor-pointer"}`}>

                    <p aria-live="polite" className="apple-label plasmo-text-[13px] plasmo-leading-relaxed plasmo-min-h-[20px] plasmo-pr-6 plasmo-whitespace-pre-wrap">
                        {result || "Translating..."}
                        {isLoading && <span className="plasmo-inline-block plasmo-w-1 plasmo-h-3 plasmo-bg-blue-500 plasmo-ml-1" />}
                    </p>

                    {/* Floating Icon */}
                    <div aria-live="polite" className={`plasmo-absolute plasmo-top-2.5 plasmo-right-2.5 plasmo-transition-all ${isCopied ? "plasmo-scale-110" : "plasmo-opacity-50 group-hover:plasmo-opacity-100"}`}>
                        {isCopied ? (
                            <div className="plasmo-flex plasmo-items-center plasmo-gap-1">
                                <span className="plasmo-text-[10px] plasmo-font-bold plasmo-text-green-400">Copied!</span>
                                <div className="plasmo-bg-green-500/20 plasmo-p-0.5 plasmo-rounded-full">
                                    <Check className="plasmo-w-2.5 plasmo-h-2.5 plasmo-text-green-400" />
                                </div>
                            </div>
                        ) : (
                            !isLoading && <Copy className="apple-muted plasmo-w-3 plasmo-h-3" />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
