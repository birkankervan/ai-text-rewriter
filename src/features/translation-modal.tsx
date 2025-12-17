import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Storage } from "@plasmohq/storage"
import type { SupportedLanguage } from "~lib/constants"
import TranslateView from "~features/translate-view"
import RewriteView from "~features/rewrite-view"

const storage = new Storage()

interface TranslationModalProps {
    isOpen: boolean
    onClose: () => void
    initialText: string
    position: { x: number; y: number }
    placement: "top" | "bottom"
    initialMode: "rewrite" | "translate"
    onReplace?: (text: string) => void
    prefetchedData?: string
    prefetchedIsLoading?: boolean
}

// Separate hook for data fetching
// Returns loading state and user preferences
const useTranslationSettings = (isOpen: boolean) => {
    const [isLoading, setIsLoading] = useState(true)
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [defaultRewriteLang, setDefaultRewriteLang] = useState<SupportedLanguage>("Keep Original")
    const [defaultTranslateLang, setDefaultTranslateLang] = useState<SupportedLanguage>("English")

    useEffect(() => {
        if (!isOpen) {
            return
        }

        let isMounted = true

        const fetchSettings = async () => {
            try {
                // Parallelize storage fetches for performance
                const [
                    activeProvider,
                    rewriteLang,
                    translateLang
                ] = await Promise.all([
                    storage.get("active_provider"),
                    storage.get("default_lang_rewrite"),
                    storage.get("default_lang_translate")
                ])

                const provider = activeProvider || "openrouter"
                // Dependent fetch: key depends on provider
                const key = await storage.get(`${provider}_key`)

                if (isMounted) {
                    setApiKey(key)
                    if (rewriteLang) setDefaultRewriteLang(rewriteLang as SupportedLanguage)
                    if (translateLang) setDefaultTranslateLang(translateLang as SupportedLanguage)
                }
            } catch (error) {
                console.error("Failed to load translation settings:", error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        setIsLoading(true)
        fetchSettings()

        return () => {
            isMounted = false
        }
    }, [isOpen])

    return {
        isLoading,
        apiKey,
        defaultRewriteLang,
        defaultTranslateLang
    }
}

export const TranslationModal = ({
    isOpen,
    onClose,
    initialText,
    position,
    placement,
    initialMode,
    onReplace,
    prefetchedData,
    prefetchedIsLoading
}: TranslationModalProps) => {
    const {
        isLoading,
        apiKey,
        defaultRewriteLang,
        defaultTranslateLang
    } = useTranslationSettings(isOpen)

    if (!isOpen) return null

    // Memoized style calculations
    const modalStyle = useMemo(() => {
        const padding = 24
        const availableHeight = placement === "top"
            ? position.y - padding
            : window.innerHeight - position.y - padding

        const maxHeight = Math.min(availableHeight, window.innerHeight * 0.85)

        return {
            left: position.x,
            top: position.y,
            transform: `translate(-50%, ${placement === "top" ? "-100%" : "0"})`,
            marginTop: placement === "bottom" ? "12px" : "0",
            marginBottom: placement === "top" ? "12px" : "0",
            maxHeight: `${maxHeight}px`,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
        } as const
    }, [position.x, position.y, placement])

    return (
        <>
            {/* Click-Outside Overlay */}
            <div
                className="plasmo-fixed plasmo-inset-0 plasmo-z-40 plasmo-bg-transparent"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="plasmo-fixed plasmo-z-50 plasmo-w-[380px] plasmo-bg-black/60 plasmo-backdrop-blur-2xl plasmo-backdrop-saturate-150 plasmo-rounded-3xl plasmo-shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] plasmo-border plasmo-border-white/10 plasmo-flex plasmo-flex-col plasmo-overflow-hidden plasmo-animate-in plasmo-fade-in plasmo-zoom-in-95 plasmo-duration-200 plasmo-ease-out plasmo-transition-all plasmo-duration-300 plasmo-ease-in-out"
                style={modalStyle}
            >
                <div className="plasmo-overflow-y-auto plasmo-flex-1 plasmo-w-full custom-scrollbar">
                    {!isLoading ? (
                        initialMode === "translate" ? (
                            <TranslateView
                                initialText={initialText}
                                apiKey={apiKey}
                                defaultTargetLang={defaultTranslateLang}
                                prefetchedData={prefetchedData}
                                prefetchedIsLoading={prefetchedIsLoading}
                            />
                        ) : (
                            <RewriteView
                                initialText={initialText}
                                onReplace={onReplace}
                                apiKey={apiKey}
                                defaultTargetLang={defaultRewriteLang}
                                radiusClass="plasmo-rounded-2xl"
                                selectRadiusClass="plasmo-rounded-xl"
                            />
                        )
                    ) : (
                        <div className="plasmo-p-8 plasmo-flex plasmo-items-center plasmo-justify-center">
                            <Loader2 className="plasmo-w-6 plasmo-h-6 plasmo-text-white/30 plasmo-animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
