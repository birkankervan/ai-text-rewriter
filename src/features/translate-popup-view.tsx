import { ArrowRight, Bot, Check, Copy, Globe, Sparkles, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLLM } from "~hooks/use-llm"
import { LANGUAGE_TO_CODE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "~lib/constants"
import { sendToBackground } from "@plasmohq/messaging"
import { ErrorState } from "./components/error-state"

export const TranslatePopupView = ({
    apiKey,
    defaultTargetLang
}: {
    apiKey: string | null
    defaultTargetLang: SupportedLanguage
}) => {
    const [inputText, setInputText] = useState("")
    const [targetLang, setTargetLang] = useState<SupportedLanguage>(defaultTargetLang)
    const [mode, setMode] = useState<"ai" | "free">("ai")
    const [isCopied, setIsCopied] = useState(false)
    const [freeResult, setFreeResult] = useState("")
    const [isFreeLoading, setIsFreeLoading] = useState(false)
    const [freeError, setFreeError] = useState<string | null>(null)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { generate, stop, isLoading: isAILoading, error: aiError, data: aiData } = useLLM()

    const isLoading = mode === "ai" ? isAILoading : isFreeLoading
    const error = mode === "ai" ? aiError : freeError
    const result = mode === "ai" ? aiData : freeResult

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [inputText])

    // Update target lang if default changes
    useEffect(() => {
        if (defaultTargetLang) {
            setTargetLang(defaultTargetLang)
        }
    }, [defaultTargetLang])

    const handleTranslate = async () => {
        if (!inputText.trim()) return

        if (mode === "ai") {
            if (!apiKey) return
            generate(inputText, { mode: "translate", targetLang })
        } else {
            // Free Mode
            setIsFreeLoading(true)
            setFreeError(null)
            setFreeResult("")

            try {
                const langCode = LANGUAGE_TO_CODE[targetLang]
                if (!langCode) throw new Error("Language not supported in Free mode")

                const resp = await sendToBackground({
                    name: "free-translate",
                    body: {
                        text: inputText,
                        to: langCode
                    }
                })

                if (resp.error) throw new Error(resp.error)
                setFreeResult(resp.translatedText)
            } catch (err: any) {
                setFreeError(err.message || "Translation failed")
            } finally {
                setIsFreeLoading(false)
            }
        }
    }

    const handleCopy = () => {
        if (!result || isLoading) return
        navigator.clipboard.writeText(result)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-3 plasmo-p-2">
            {/* Input Area */}
            <div className="plasmo-relative plasmo-group">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="plasmo-w-full plasmo-bg-white/5 plasmo-rounded-lg plasmo-p-3 plasmo-text-white/90 plasmo-resize-none focus:plasmo-outline-none focus:plasmo-ring-1 focus:plasmo-ring-white/20 focus:plasmo-bg-white/10 plasmo-transition-all plasmo-text-xs plasmo-leading-relaxed plasmo-placeholder-white/20"
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
                            className="plasmo-w-full plasmo-bg-gray-100/10 plasmo-text-white/90 plasmo-text-[11px] plasmo-font-bold plasmo-rounded-md plasmo-px-2 plasmo-py-1.5 plasmo-appearance-none focus:plasmo-outline-none focus:plasmo-ring-1 focus:plasmo-ring-white/20 hover:plasmo-bg-white/10 plasmo-transition-all plasmo-cursor-pointer disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
                            {SUPPORTED_LANGUAGES.filter(l => l !== "Keep Original").map(lang => (
                                <option key={lang} value={lang} className="plasmo-text-black">
                                    {lang}
                                </option>
                            ))}
                        </select>
                        <div className="plasmo-absolute plasmo-right-2 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-pointer-events-none">
                            <ArrowRight className="plasmo-w-3 plasmo-h-3 plasmo-text-white/50" />
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="plasmo-flex plasmo-bg-black/20 plasmo-rounded-md plasmo-p-0.5 plasmo-border plasmo-border-white/5">
                        <button
                            onClick={() => setMode("ai")}
                            disabled={isLoading || !apiKey}
                            title={!apiKey ? "Add API key in settings to use AI" : "Use AI for high-quality translation"}
                            className={`plasmo-px-2 plasmo-py-1 plasmo-rounded-sm plasmo-text-[10px] plasmo-font-bold plasmo-transition-all plasmo-flex plasmo-items-center plasmo-gap-1 ${!apiKey
                                ? "plasmo-opacity-40 plasmo-cursor-not-allowed plasmo-text-white/30"
                                : mode === "ai"
                                    ? "plasmo-bg-white/10 plasmo-text-white plasmo-shadow-sm"
                                    : "plasmo-text-white/40 hover:plasmo-text-white/60"
                                }`}>
                            {apiKey ? <Bot className="plasmo-w-3 plasmo-h-3" /> : <span className="plasmo-text-[8px]">🔒</span>}
                            AI
                        </button>
                        <button
                            onClick={() => setMode("free")}
                            disabled={isLoading}
                            className={`plasmo-px-2 plasmo-py-1 plasmo-rounded-sm plasmo-text-[10px] plasmo-font-bold plasmo-transition-all plasmo-flex plasmo-items-center plasmo-gap-1 ${mode === "free"
                                ? "plasmo-bg-white/10 plasmo-text-white plasmo-shadow-sm"
                                : "plasmo-text-white/40 hover:plasmo-text-white/60"
                                }`}>
                            <Zap className="plasmo-w-3 plasmo-h-3" />
                            Free
                        </button>
                    </div>
                </div>

                {/* Translate Button */}
                <button
                    onClick={handleTranslate}
                    disabled={isLoading || !inputText.trim() || (mode === "ai" && !apiKey)}
                    className="plasmo-w-full plasmo-bg-blue-600 hover:plasmo-bg-blue-500 disabled:plasmo-bg-gray-700 plasmo-text-white plasmo-py-1.5 plasmo-rounded-lg plasmo-font-bold plasmo-text-xs plasmo-shadow-lg plasmo-shadow-blue-500/20 plasmo-transition-all plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 hover:plasmo-scale-[1.01] active:plasmo-scale-[0.98] disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
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
                <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-mt-1">
                    <div className="plasmo-w-1 plasmo-h-1 plasmo-rounded-full plasmo-bg-white/20" />
                    <p className="plasmo-text-[9px] plasmo-text-white/30 plasmo-font-medium">
                        Only translates text. No rewriting or style changes applied.
                    </p>
                    <div className="plasmo-w-1 plasmo-h-1 plasmo-rounded-full plasmo-bg-white/20" />
                </div>
            </div>

            {/* Error Message */}
            {error && <ErrorState error={error} onRetry={handleTranslate} />}

            {/* Result Area */}
            {(result || isLoading) && !error && (
                <div
                    onClick={handleCopy}
                    className={`plasmo-relative plasmo-p-3 plasmo-rounded-lg plasmo-border plasmo-backdrop-blur-sm plasmo-transition-all plasmo-duration-200 plasmo-group plasmo-mt-1 ${isLoading
                        ? "plasmo-cursor-wait plasmo-bg-blue-500/5 plasmo-border-blue-500/10"
                        : "plasmo-cursor-pointer plasmo-bg-blue-500/10 plasmo-border-blue-500/20 hover:plasmo-bg-blue-500/20 hover:plasmo-border-blue-500/30"
                        } ${isCopied ? "plasmo-bg-green-500/10 plasmo-border-green-500/50" : ""}`}>

                    <p className="plasmo-text-white/90 plasmo-text-xs plasmo-leading-relaxed plasmo-min-h-[20px] plasmo-pr-6 whitespace-pre-wrap">
                        {result || "Translating..."}
                        {isLoading && <span className="plasmo-inline-block plasmo-w-1.5 plasmo-h-3 plasmo-bg-blue-400 plasmo-ml-1 plasmo-animate-pulse" />}
                    </p>

                    {/* Floating Icon */}
                    <div className={`plasmo-absolute plasmo-top-2.5 plasmo-right-2.5 plasmo-transition-all plasmo-duration-300 ${isCopied ? "plasmo-scale-110" : "plasmo-opacity-50 group-hover:plasmo-opacity-100"}`}>
                        {isCopied ? (
                            <div className="plasmo-flex plasmo-items-center plasmo-gap-1">
                                <span className="plasmo-text-[10px] plasmo-font-bold plasmo-text-green-400 plasmo-animate-in plasmo-fade-in plasmo-slide-in-from-right-1">Copied!</span>
                                <div className="plasmo-bg-green-500/20 plasmo-p-0.5 plasmo-rounded-full">
                                    <Check className="plasmo-w-2.5 plasmo-h-2.5 plasmo-text-green-400" />
                                </div>
                            </div>
                        ) : (
                            !isLoading && <Copy className="plasmo-w-3 plasmo-h-3 plasmo-text-white" />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
