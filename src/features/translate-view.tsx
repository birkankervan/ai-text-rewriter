import { ArrowRight, Check, Copy, Globe } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLLM } from "~hooks/use-llm"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "~lib/constants"
import { ErrorState } from "./components/error-state"

export const TranslateView = ({
    initialText,
    apiKey,
    defaultTargetLang,
    prefetchedData,
    prefetchedIsLoading
}: {
    initialText: string
    apiKey: string | null
    defaultTargetLang: SupportedLanguage
    prefetchedData?: string
    prefetchedIsLoading?: boolean
}) => {
    const [sessionTargetLang, setSessionTargetLang] = useState<SupportedLanguage>(defaultTargetLang)
    const [isCopied, setIsCopied] = useState(false)
    const [overridePrefetch, setOverridePrefetch] = useState(false)
    const { generate, stop, isLoading: isLocalLoading, error, data: localData } = useLLM()

    // Determine effective data and loading state
    const isUsingPrefetch = (prefetchedData !== undefined || prefetchedIsLoading === true) && !overridePrefetch
    const data = isUsingPrefetch ? prefetchedData : localData
    const isLoading = isUsingPrefetch ? prefetchedIsLoading : isLocalLoading

    // Auto-start translation on mount (only if not using prefetch)
    useEffect(() => {
        // Translation gateway handles provider selection (doesn't need API key check)
        if (initialText && !isUsingPrefetch) {
            generate(initialText, { mode: "translate", targetLang: sessionTargetLang })
        }
    }, [initialText, isUsingPrefetch])

    // Update target lang if default changes (only on initial mount effectively)
    useEffect(() => {
        if (defaultTargetLang) {
            setSessionTargetLang(defaultTargetLang)
        }
    }, [defaultTargetLang])

    const handleLanguageChange = (newLang: SupportedLanguage) => {
        if (newLang === sessionTargetLang) return

        // 1. Stop previous generation if any
        stop()

        // 2. Update state
        setSessionTargetLang(newLang)
        setOverridePrefetch(true)

        // 3. Start new generation immediately (gateway handles provider)
        if (initialText) {
            generate(initialText, { mode: "translate", targetLang: newLang })
        }
    }

    const handleCopy = () => {
        if (!data || isLoading) return
        navigator.clipboard.writeText(data)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-3 plasmo-p-4">
            {/* Language Selector Row (Compact) */}
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                    <Globe className="plasmo-w-3.5 plasmo-h-3.5 plasmo-text-blue-400" />
                    <span className="plasmo-text-xs plasmo-font-medium plasmo-text-white/70">Translate</span>
                </div>

                {/* Language Pill */}
                <div className={`plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-bg-white/5 plasmo-rounded-lg plasmo-p-1 plasmo-border plasmo-border-white/10 ${isLoading ? "plasmo-opacity-50 plasmo-cursor-not-allowed" : ""}`}>
                    <span className="plasmo-text-[10px] plasmo-text-white/50 plasmo-px-2">Auto</span>
                    <ArrowRight className="plasmo-w-3 plasmo-h-3 plasmo-text-white/30" />
                    <select
                        value={sessionTargetLang}
                        disabled={isLoading}
                        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                        className="plasmo-bg-transparent plasmo-text-white plasmo-text-[10px] plasmo-font-medium focus:plasmo-outline-none plasmo-cursor-pointer plasmo-appearance-none plasmo-py-0.5 plasmo-px-2 hover:plasmo-text-white/80 plasmo-transition-colors disabled:plasmo-cursor-not-allowed">
                        {SUPPORTED_LANGUAGES.filter(l => l !== "Keep Original").map(lang => (
                            <option key={lang} value={lang} className="plasmo-text-black">
                                {lang}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Read-Only Original Text */}
            <div className="plasmo-p-3 plasmo-rounded-xl plasmo-bg-white/5 plasmo-border plasmo-border-white/5">
                <p className="plasmo-text-white/50 plasmo-text-xs plasmo-leading-relaxed line-clamp-3">
                    {initialText}
                </p>
            </div>

            {/* Error State */}
            {error && <ErrorState error={error} onRetry={() => generate(initialText, { mode: "translate", targetLang: sessionTargetLang })} />}

            {/* Result Area (Hero) */}
            {(!error) && (
                <div
                    onClick={handleCopy}
                    className={`plasmo-relative plasmo-p-4 plasmo-rounded-xl plasmo-border plasmo-backdrop-blur-sm plasmo-transition-all plasmo-duration-200 plasmo-group plasmo-min-h-[80px] ${isLoading
                        ? "plasmo-cursor-wait plasmo-bg-blue-500/5 plasmo-border-blue-500/10"
                        : "plasmo-cursor-pointer plasmo-bg-blue-500/10 plasmo-border-blue-500/20 hover:plasmo-bg-blue-500/20 hover:plasmo-border-blue-500/30"
                        } ${isCopied ? "plasmo-bg-green-500/10 plasmo-border-green-500/50" : ""}`}>

                    <p className="plasmo-text-white/90 plasmo-text-sm plasmo-leading-relaxed plasmo-font-medium plasmo-pr-6">
                        {data || (isLoading ? "" : "Waiting...")}
                        {isLoading && <span className="plasmo-inline-block plasmo-w-1.5 plasmo-h-3.5 plasmo-bg-blue-400 plasmo-ml-1 plasmo-animate-pulse" />}
                    </p>

                    {/* Floating Icon */}
                    <div className={`plasmo-absolute plasmo-top-3 plasmo-right-3 plasmo-transition-all plasmo-duration-300 ${isCopied ? "plasmo-scale-110" : "plasmo-opacity-50 group-hover:plasmo-opacity-100"}`}>
                        {isCopied ? (
                            <div className="plasmo-flex plasmo-items-center plasmo-gap-1.5">
                                <span className="plasmo-text-[10px] plasmo-font-bold plasmo-text-green-400 plasmo-animate-in plasmo-fade-in plasmo-slide-in-from-right-1">Copied!</span>
                                <div className="plasmo-bg-green-500/20 plasmo-p-1 plasmo-rounded-full">
                                    <Check className="plasmo-w-3 plasmo-h-3 plasmo-text-green-400" />
                                </div>
                            </div>
                        ) : (
                            !isLoading && <Copy className="plasmo-w-3.5 plasmo-h-3.5 plasmo-text-white" />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default TranslateView
