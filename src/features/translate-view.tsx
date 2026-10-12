import { ArrowRight, Check, Copy, Globe } from "lucide-react"
import { onActivate } from "~lib/a11y"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useLLM } from "~hooks/use-llm"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "~lib/constants"
import { ErrorState } from "./components/error-state"

interface TranslateViewProps {
    initialText: string
    apiKey: string | null
    defaultTargetLang: SupportedLanguage
}

export const TranslateView = ({
    initialText,
    apiKey,
    defaultTargetLang
}: TranslateViewProps) => {
    const [sessionTargetLang, setSessionTargetLang] = useState<SupportedLanguage>(defaultTargetLang)
    const [isCopied, setIsCopied] = useState(false)
    const { generate, isLoading, error, data } = useLLM()

    // Auto-start translation after the user opens the modal
    useEffect(() => {
        // Translation gateway handles provider selection (doesn't need API key check)
        if (initialText) {
            generate(initialText, { mode: "translate", targetLang: sessionTargetLang })
        }
    }, [initialText, generate, sessionTargetLang])

    // Update target lang if default changes (only on initial mount effectively)
    useEffect(() => {
        if (defaultTargetLang) {
            setSessionTargetLang(defaultTargetLang)
        }
    }, [defaultTargetLang])

    const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
        if (newLang === sessionTargetLang) return
        setSessionTargetLang(newLang)
    }, [sessionTargetLang])

    const handleCopy = useCallback(() => {
        if (!data || isLoading) return
        navigator.clipboard.writeText(data)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }, [data, isLoading])

    // Memoize options to prevent unnecessary re-renders of list items
    const languageOptions = useMemo(() => (
        SUPPORTED_LANGUAGES.filter(l => l !== "Keep Original").map(lang => (
            <option key={lang} value={lang} className="plasmo-text-black">
                {lang}
            </option>
        ))
    ), [])

    return (
        <div className="apple-theme plasmo-flex plasmo-flex-col plasmo-gap-3 plasmo-p-4">
            {/* Language Selector Row (Compact) */}
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                    <Globe className="plasmo-w-3.5 plasmo-h-3.5 plasmo-text-blue-400" />
                    <span className="apple-label plasmo-text-xs plasmo-font-semibold">Translate</span>
                </div>

                {/* Language Pill */}
                <div className={`apple-control-group plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-rounded-full plasmo-p-1 ${isLoading ? "plasmo-opacity-50 plasmo-cursor-not-allowed" : ""}`}>
                    <span className="apple-muted plasmo-text-xs plasmo-px-2">Auto</span>
                    <ArrowRight className="apple-muted plasmo-w-3 plasmo-h-3" />
                    <select
                        value={sessionTargetLang}
                        disabled={isLoading}
                        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                        className="apple-label plasmo-bg-transparent plasmo-text-xs plasmo-font-medium focus:plasmo-outline-none plasmo-cursor-pointer plasmo-appearance-none plasmo-py-1 plasmo-px-2 disabled:plasmo-cursor-not-allowed">
                        {languageOptions}
                    </select>
                </div>
            </div>

            {/* Read-Only Original Text */}
            <div className="apple-result plasmo-p-3 plasmo-rounded-xl">
                <p className="apple-muted plasmo-text-xs plasmo-leading-relaxed plasmo-line-clamp-3">
                    {initialText}
                </p>
            </div>

            {/* Error State */}
            {error && <ErrorState error={error} onRetry={() => generate(initialText, { mode: "translate", targetLang: sessionTargetLang })} />}

            {/* Result Area (Hero) */}
            {(!error) && (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Copy result"
                    onClick={handleCopy}
                    onKeyDown={onActivate(handleCopy)}
                    className={`apple-result plasmo-relative plasmo-p-4 plasmo-rounded-xl plasmo-transition-colors plasmo-group plasmo-min-h-[80px] ${isLoading ? "plasmo-cursor-wait" : "plasmo-cursor-pointer"}`}>

                    <p aria-live="polite" className="apple-label plasmo-text-sm plasmo-leading-relaxed plasmo-font-medium plasmo-pr-6">
                        {data || (isLoading ? "" : "Waiting...")}
                        {isLoading && <span className="plasmo-inline-block plasmo-w-1 plasmo-h-3.5 plasmo-bg-blue-500 plasmo-ml-1" />}
                    </p>

                    {/* Floating Icon */}
                    <div aria-live="polite" className={`plasmo-absolute plasmo-top-3 plasmo-right-3 plasmo-transition-all ${isCopied ? "plasmo-scale-110" : "plasmo-opacity-50 group-hover:plasmo-opacity-100"}`}>
                        {isCopied ? (
                            <div className="plasmo-flex plasmo-items-center plasmo-gap-1.5">
                                <span className="plasmo-text-[10px] plasmo-font-bold plasmo-text-green-400">Copied!</span>
                                <div className="plasmo-bg-green-500/20 plasmo-p-1 plasmo-rounded-full">
                                    <Check className="plasmo-w-3 plasmo-h-3 plasmo-text-green-400" />
                                </div>
                            </div>
                        ) : (
                            !isLoading && <Copy className="apple-muted plasmo-w-3.5 plasmo-h-3.5" />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default TranslateView
