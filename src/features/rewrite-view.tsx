import { ArrowRight, Check, Copy, RefreshCw, Sparkles, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLLM } from "~hooks/use-llm"
import { SUPPORTED_LANGUAGES, TONES, type SupportedLanguage, type Tone } from "~lib/constants"
import { ErrorState } from "./components/error-state"

export const RewriteView = ({
    initialText,
    onReplace,
    apiKey,
    defaultTargetLang,
    showPlaceholder = false
}: {
    initialText: string
    onReplace?: (text: string) => void
    apiKey: string | null
    defaultTargetLang: SupportedLanguage
    showPlaceholder?: boolean
}) => {
    const [inputText, setInputText] = useState(initialText)
    const [tone, setTone] = useState<Tone>("Professional")
    const [targetLang, setTargetLang] = useState<SupportedLanguage>(defaultTargetLang)
    const [isCopied, setIsCopied] = useState(false)
    const [fixGrammar, setFixGrammar] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { generate, stop, reset, isLoading, error, data } = useLLM()

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

    const handleGenerate = () => {
        if (!apiKey) return
        // Combine tone with grammar if checked
        const effectiveTone = fixGrammar ? `Fix Grammar & ${tone}` : tone
        generate(inputText, { mode: "rewrite", tone: effectiveTone, targetLang })
    }

    const handleCopy = () => {
        if (!data || isLoading) return
        navigator.clipboard.writeText(data)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-1.5 plasmo-p-2">
            {/* Editable Input (No Header) */}
            <div className="plasmo-relative plasmo-group">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="plasmo-w-full plasmo-bg-white/5 plasmo-rounded-lg plasmo-p-2 plasmo-text-white/90 plasmo-resize-none focus:plasmo-outline-none focus:plasmo-ring-1 focus:plasmo-ring-white/20 focus:plasmo-bg-white/10 plasmo-transition-all plasmo-text-xs plasmo-leading-relaxed plasmo-placeholder-white/20"
                    rows={2}
                    placeholder="Enter text to process..."
                />
            </div>

            {/* Controls Row */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <div className="plasmo-flex plasmo-gap-1">
                    {/* Tone Selector */}
                    <div className="plasmo-relative plasmo-flex-1">
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value as Tone)}
                            disabled={isLoading}
                            className="plasmo-w-full plasmo-h-full plasmo-bg-gray-100/10 plasmo-text-white/90 plasmo-text-[11px] plasmo-font-bold plasmo-rounded-md plasmo-px-2 plasmo-py-1.5 plasmo-appearance-none focus:plasmo-outline-none focus:plasmo-ring-1 focus:plasmo-ring-white/20 hover:plasmo-bg-white/10 plasmo-transition-all plasmo-cursor-pointer disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
                            {TONES.map((t) => (
                                <option key={t} value={t} className="plasmo-text-black">
                                    {t}
                                </option>
                            ))}
                        </select>
                        <div className="plasmo-absolute plasmo-right-1.5 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-pointer-events-none">
                            <ArrowRight className="plasmo-w-2.5 plasmo-h-2.5 plasmo-text-white/50" />
                        </div>
                    </div>

                    {/* Language Selector */}
                    <div className="plasmo-relative plasmo-flex-1">
                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
                            disabled={isLoading}
                            className="plasmo-w-full plasmo-h-full plasmo-bg-gray-100/10 plasmo-text-white/90 plasmo-text-[11px] plasmo-font-bold plasmo-rounded-md plasmo-px-2 plasmo-py-1.5 plasmo-appearance-none focus:plasmo-outline-none focus:plasmo-ring-1 focus:plasmo-ring-white/20 hover:plasmo-bg-white/10 plasmo-transition-all plasmo-cursor-pointer disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
                            {SUPPORTED_LANGUAGES.map(lang => (
                                <option key={lang} value={lang} className="plasmo-text-black">
                                    {lang === "Keep Original" ? "Original Language" : lang}
                                </option>
                            ))}
                        </select>
                        <div className="plasmo-absolute plasmo-right-1.5 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-pointer-events-none">
                            <ArrowRight className="plasmo-w-2.5 plasmo-h-2.5 plasmo-text-white/50" />
                        </div>
                    </div>
                </div>

                {/* Grammar Toggle */}
                <label className="plasmo-flex plasmo-items-center plasmo-gap-1.5 plasmo-cursor-pointer plasmo-group plasmo-self-start plasmo-px-1">
                    <div className={`plasmo-w-3 plasmo-h-3 plasmo-rounded plasmo-border plasmo-flex plasmo-items-center plasmo-justify-center plasmo-transition-all ${fixGrammar ? "plasmo-bg-blue-500 plasmo-border-blue-500" : "plasmo-border-white/30 group-hover:plasmo-border-white/50"}`}>
                        {fixGrammar && <Check className="plasmo-w-2 plasmo-h-2 plasmo-text-white" />}
                    </div>
                    <input type="checkbox" checked={fixGrammar} onChange={(e) => setFixGrammar(e.target.checked)} className="plasmo-hidden" />
                    <span className="plasmo-text-[10px] plasmo-text-white/70 group-hover:plasmo-text-white/90">Fix Grammar</span>
                </label>
            </div>

            {/* Action Button */}
            {!data && !isLoading && !error && (
                <>
                    <button
                        onClick={handleGenerate}
                        disabled={!apiKey || !inputText.trim()}
                        className={`plasmo-w-full plasmo-py-1.5 plasmo-rounded-lg plasmo-font-bold plasmo-text-xs plasmo-shadow-lg plasmo-transition-all plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 ${!apiKey
                            ? "plasmo-bg-gray-600/50 plasmo-text-white/50 plasmo-cursor-not-allowed plasmo-shadow-none"
                            : "plasmo-bg-blue-600 hover:plasmo-bg-blue-500 plasmo-text-white plasmo-shadow-blue-500/20 hover:plasmo-scale-[1.01] active:plasmo-scale-[0.98]"
                            }`}>
                        <Sparkles className="plasmo-w-3 plasmo-h-3" />
                        Generate
                    </button>
                    {!apiKey && (
                        <p className="plasmo-text-[10px] plasmo-text-red-400 plasmo-text-center plasmo-mt-1">
                            ⚠️ API Key required for Rewrite. Configure in settings.
                        </p>
                    )}
                </>
            )}

            {/* Stop Button */}
            {isLoading && (
                <button
                    onClick={stop}
                    className="plasmo-w-full plasmo-bg-red-500/10 hover:plasmo-bg-red-500/20 plasmo-text-red-400 plasmo-py-1.5 plasmo-rounded-lg plasmo-font-bold plasmo-text-xs plasmo-border plasmo-border-red-500/20 plasmo-transition-all plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5">
                    <Square className="plasmo-w-3 plasmo-h-3 plasmo-fill-current" />
                    Stop Generation
                </button>
            )}

            {/* Error State */}
            {error && <ErrorState error={error} onRetry={handleGenerate} />}

            {/* Result Area */}
            {(data || isLoading || showPlaceholder) && !error && (
                <div className="plasmo-flex plasmo-flex-col plasmo-gap-1.5 plasmo-animate-in plasmo-fade-in plasmo-slide-in-from-top-2 plasmo-duration-300">
                    {/* Interactive Result Box */}
                    <div
                        onClick={handleCopy}
                        className={`plasmo-relative plasmo-p-2 plasmo-rounded-lg plasmo-border plasmo-backdrop-blur-sm plasmo-transition-all plasmo-duration-200 plasmo-group ${isLoading
                            ? "plasmo-cursor-wait plasmo-bg-blue-500/5 plasmo-border-blue-500/10"
                            : "plasmo-cursor-pointer plasmo-bg-blue-500/10 plasmo-border-blue-500/20 hover:plasmo-bg-blue-500/20 hover:plasmo-border-blue-500/30"
                            } ${isCopied ? "plasmo-bg-green-500/10 plasmo-border-green-500/50" : ""} ${!data && !isLoading ? "plasmo-h-[80px] plasmo-flex plasmo-items-center plasmo-justify-center" : ""}`}>

                        {!data && !isLoading ? (
                            <p className="plasmo-text-white/30 plasmo-text-[10px] plasmo-font-medium plasmo-italic">
                                AI output will appear here...
                            </p>
                        ) : (
                            <p className="plasmo-text-white/90 plasmo-text-xs plasmo-leading-relaxed plasmo-min-h-[20px] plasmo-pr-6">
                                {data}
                                {isLoading && <span className="plasmo-inline-block plasmo-w-1.5 plasmo-h-3 plasmo-bg-blue-400 plasmo-ml-1 plasmo-animate-pulse" />}
                            </p>
                        )}

                        {/* Floating Icon */}
                        {(data || isLoading) && (
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
                        )}
                    </div>

                    {!isLoading && data && (
                        <div className="plasmo-flex plasmo-gap-2">
                            <button
                                onClick={handleGenerate}
                                className="plasmo-flex-1 plasmo-bg-white/5 hover:plasmo-bg-white/10 plasmo-text-white/70 plasmo-py-2 plasmo-rounded-xl plasmo-font-semibold plasmo-text-[10px] plasmo-transition-all plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5">
                                <RefreshCw className="plasmo-w-3 plasmo-h-3" />
                                Try Again
                            </button>
                            {onReplace ? (
                                <button
                                    onClick={() => onReplace(data || "")}
                                    className="plasmo-flex-[2] plasmo-bg-green-500 hover:plasmo-bg-green-400 plasmo-text-white plasmo-py-2 plasmo-rounded-xl plasmo-font-bold plasmo-text-[10px] plasmo-shadow-lg plasmo-shadow-green-500/20 plasmo-transition-all plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 hover:plasmo-scale-[1.01] active:plasmo-scale-[0.98]">
                                    <Sparkles className="plasmo-w-3 plasmo-h-3" />
                                    Replace Text
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setInputText("")
                                        reset()
                                    }}
                                    className="plasmo-flex-[2] plasmo-bg-purple-500 hover:plasmo-bg-purple-400 plasmo-text-white plasmo-py-2 plasmo-rounded-xl plasmo-font-bold plasmo-text-[10px] plasmo-shadow-lg plasmo-shadow-purple-500/20 plasmo-transition-all plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 hover:plasmo-scale-[1.01] active:plasmo-scale-[0.98]">
                                    <Sparkles className="plasmo-w-3 plasmo-h-3" />
                                    New Rewrite
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default RewriteView
