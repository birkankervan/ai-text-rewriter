import { Check, ChevronDown, Copy, RefreshCw, Sparkles, Square } from "lucide-react"
import { onActivate } from "~lib/a11y"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { useLLM } from "~hooks/use-llm"
import { SUPPORTED_LANGUAGES, TONES, type SupportedLanguage, type Tone } from "~lib/constants"
import { ErrorState } from "./components/error-state"
import { Button } from "~components/ui/button"
import { Textarea } from "~components/ui/textarea"
import { RecentRewrites } from "./recent-rewrites"

const storage = new Storage()
const LAST_REWRITE_TONE = "last_rewrite_tone"
const LAST_REWRITE_LANGUAGE = "last_rewrite_language"

interface RewriteViewProps {
    initialText: string
    onReplace?: (text: string) => void
    apiKey: string | null
    defaultTargetLang: SupportedLanguage
    showPlaceholder?: boolean
    radiusClass?: string
    selectRadiusClass?: string
    embedded?: boolean
    onOpenSettings?: () => void
}

export const RewriteView = ({
    initialText,
    onReplace,
    apiKey,
    defaultTargetLang,
    showPlaceholder = false,
    radiusClass = "plasmo-rounded-lg",
    selectRadiusClass = "plasmo-rounded-md",
    embedded = false,
    onOpenSettings
}: RewriteViewProps) => {
    const [inputText, setInputText] = useState(initialText)
    const [tone, setTone] = useState<Tone>("Professional")
    const [targetLang, setTargetLang] = useState<SupportedLanguage>(defaultTargetLang)
    const [isCopied, setIsCopied] = useState(false)
    const [fixGrammar, setFixGrammar] = useState(false)
    const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { generate, stop, reset, isLoading, error, data } = useLLM()

    // Optimize Textarea Auto-resize
    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setInputText(val)

        // Synchronous resize to prevent jitter
        const el = e.target
        el.style.height = "auto"
        el.style.height = `${el.scrollHeight}px`
    }, [])

    // Initial resize and programmatic updates
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [inputText])

    useEffect(() => {
        let mounted = true

        Promise.all([
            storage.get(LAST_REWRITE_TONE),
            storage.get(LAST_REWRITE_LANGUAGE)
        ]).then(([savedTone, savedLanguage]) => {
            if (!mounted) return
            if (TONES.includes(savedTone as Tone)) setTone(savedTone as Tone)
            if (SUPPORTED_LANGUAGES.includes(savedLanguage as SupportedLanguage)) {
                setTargetLang(savedLanguage as SupportedLanguage)
            }
        })

        return () => {
            mounted = false
        }
    }, [])

    const handleToneChange = useCallback((value: Tone) => {
        setTone(value)
        storage.set(LAST_REWRITE_TONE, value)
    }, [])

    const handleLanguageChange = useCallback((value: SupportedLanguage) => {
        setTargetLang(value)
        storage.set(LAST_REWRITE_LANGUAGE, value)
    }, [])

    const handleGenerate = useCallback(async () => {
        if (!apiKey) return
        await generate(inputText, { mode: "rewrite", tone, targetLang, fixGrammar })
        setHistoryRefreshKey(key => key + 1)
    }, [apiKey, fixGrammar, tone, generate, inputText, targetLang])

    const handleCopy = useCallback(() => {
        if (!data || isLoading) return
        navigator.clipboard.writeText(data)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }, [data, isLoading])

    const handleReplace = useCallback(() => {
        if (onReplace && data) {
            onReplace(data)
        }
    }, [onReplace, data])

    const handleNewRewrite = useCallback(() => {
        setInputText("")
        reset()
    }, [reset])

    // Memoize options to prevent unnecessary re-renders of list items
    const toneOptions = useMemo(() => (
        TONES.map((t) => (
            <option key={t} value={t} className="plasmo-text-black">
                {t}
            </option>
        ))
    ), [])

    const langOptions = useMemo(() => (
        SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang} value={lang} className="plasmo-text-black">
                {lang === "Keep Original" ? "Original Language" : lang}
            </option>
        ))
    ), [])

    return (
        <div className={`apple-theme plasmo-flex plasmo-flex-col plasmo-gap-3 ${embedded ? "" : "apple-card plasmo-p-3"}`}>
            {/* Editable Input (No Header) */}
            <div className="plasmo-relative plasmo-group">
                <div className="plasmo-relative plasmo-group">
                    <Textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={handleInput}
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        className={`plasmo-p-2 ${radiusClass}`}
                        rows={2}
                        placeholder="Enter text to process..."
                    />
                </div>
            </div>

            {/* Controls Row */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <div className="plasmo-flex plasmo-gap-1">
                    {/* Tone Selector */}
                    <div className="plasmo-relative plasmo-flex-1">
                        <select
                            value={tone}
                            onChange={(e) => handleToneChange(e.target.value as Tone)}
                            disabled={isLoading}
                            className={`apple-field plasmo-w-full plasmo-h-10 plasmo-text-xs plasmo-font-semibold ${selectRadiusClass} plasmo-px-3 plasmo-appearance-none plasmo-transition-all plasmo-cursor-pointer disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed`}
                        >
                            {toneOptions}
                        </select>
                        <div className="plasmo-absolute plasmo-right-1.5 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-pointer-events-none">
                            <ChevronDown className="apple-muted plasmo-w-3 plasmo-h-3" />
                        </div>
                    </div>

                    {/* Language Selector */}
                    <div className="plasmo-relative plasmo-flex-1">
                        <select
                            value={targetLang}
                            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                            disabled={isLoading}
                            className={`apple-field plasmo-w-full plasmo-h-10 plasmo-text-xs plasmo-font-semibold ${selectRadiusClass} plasmo-px-3 plasmo-appearance-none plasmo-transition-all plasmo-cursor-pointer disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed`}
                        >
                            {langOptions}
                        </select>
                        <div className="plasmo-absolute plasmo-right-1.5 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-pointer-events-none">
                            <ChevronDown className="apple-muted plasmo-w-3 plasmo-h-3" />
                        </div>
                    </div>
                </div>

                {/* Grammar Toggle */}
                <label className="plasmo-flex plasmo-items-center plasmo-gap-1.5 plasmo-cursor-pointer plasmo-group plasmo-self-start plasmo-px-1">
                    <input type="checkbox" checked={fixGrammar} onChange={(e) => setFixGrammar(e.target.checked)} className="plasmo-peer plasmo-sr-only" />
                    <div className={`plasmo-w-4 plasmo-h-4 plasmo-rounded plasmo-border plasmo-flex plasmo-items-center plasmo-justify-center plasmo-transition-all peer-focus-visible:plasmo-ring-2 peer-focus-visible:plasmo-ring-blue-500 ${fixGrammar ? "plasmo-bg-blue-500 plasmo-border-blue-500" : "plasmo-border-gray-400"}`}>
                        {fixGrammar && <Check className="plasmo-w-2 plasmo-h-2 plasmo-text-white" />}
                    </div>
                    <span className="apple-muted plasmo-text-xs">Fix Grammar</span>
                </label>
            </div>

            {/* Action Button */}
            {!data && !isLoading && !error && apiKey && (
                <>
                    <Button
                        onClick={handleGenerate}
                        disabled={!apiKey || !inputText.trim()}
                        className={`${radiusClass} plasmo-w-full`}
                    >
                        <Sparkles className="plasmo-w-3 plasmo-h-3" />
                        Generate
                    </Button>
                </>
            )}

            {!apiKey && !data && !isLoading && !error && (
                <div className="tvos-focus-row plasmo-rounded-2xl plasmo-p-4">
                    <p className="apple-label plasmo-text-xs plasmo-font-semibold">AI provider is not connected</p>
                    <p className="apple-muted plasmo-mt-1 plasmo-text-[11px]">Add an API key and choose a provider before rewriting.</p>
                    <button
                        type="button"
                        onClick={onOpenSettings || (() => window.open(chrome.runtime.getURL("options.html"), "_blank"))}
                        className="provider-setup-button plasmo-mt-4 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-px-4">
                        Configure provider
                    </button>
                </div>
            )}

            {/* Stop Button */}
            {isLoading && (
                <Button
                    onClick={stop}
                    variant="danger"
                    className={`${radiusClass} plasmo-w-full`}
                >
                    <Square className="plasmo-w-3 plasmo-h-3 plasmo-fill-current" />
                    Stop Generation
                </Button>
            )}

            {/* Error State */}
            {error && <ErrorState error={error} onRetry={handleGenerate} />}

            {/* Result Area */}
            {(data || isLoading || showPlaceholder) && !error && (
                <div className="plasmo-flex plasmo-flex-col plasmo-gap-1.5">
                    {/* Interactive Result Box */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Copy result"
                        onClick={handleCopy}
                        onKeyDown={onActivate(handleCopy)}
                        className={`apple-result plasmo-relative plasmo-p-3 ${radiusClass} plasmo-transition-colors plasmo-group ${isLoading ? "plasmo-cursor-wait" : "plasmo-cursor-pointer"} ${!data && !isLoading ? "plasmo-h-[80px] plasmo-flex plasmo-items-center plasmo-justify-center" : ""}`}
                    >
                        {!data && !isLoading ? (
                            <p className="apple-muted plasmo-text-xs plasmo-font-medium">
                                AI output will appear here...
                            </p>
                        ) : (
                            <p aria-live="polite" className="apple-label plasmo-text-[13px] plasmo-leading-relaxed plasmo-min-h-[20px] plasmo-pr-6 plasmo-whitespace-pre-wrap">
                                {data}
                                {isLoading && <span className="plasmo-inline-block plasmo-w-1 plasmo-h-3 plasmo-bg-blue-500 plasmo-ml-1" />}
                            </p>
                        )}

                        {/* Floating Icon */}
                        {(data || isLoading) && (
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
                        )}
                    </div>

                    {!isLoading && data && (
                        <div className="plasmo-flex plasmo-gap-2">
                            <Button
                                onClick={handleGenerate}
                                variant="secondary"
                                className={`plasmo-flex-1 ${radiusClass}`}
                            >
                                <RefreshCw className="plasmo-w-3 plasmo-h-3" />
                                Try Again
                            </Button>
                            {onReplace ? (
                                <button
                                    onClick={handleReplace}
                                    className={`apple-primary plasmo-flex-[2] plasmo-py-2 ${radiusClass} plasmo-text-xs plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5`}
                                >
                                    <Sparkles className="plasmo-w-3 plasmo-h-3" />
                                    Replace Text
                                </button>
                            ) : (
                                <button
                                    onClick={handleNewRewrite}
                                    className={`apple-primary plasmo-flex-[2] plasmo-py-2 ${radiusClass} plasmo-text-xs plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5`}
                                >
                                    <Sparkles className="plasmo-w-3 plasmo-h-3" />
                                    New Rewrite
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <RecentRewrites refreshKey={historyRefreshKey} />
        </div>
    )
}

export default RewriteView
