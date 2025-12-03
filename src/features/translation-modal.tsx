import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
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
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [defaultRewriteLang, setDefaultRewriteLang] = useState<SupportedLanguage>("Keep Original")
    const [defaultTranslateLang, setDefaultTranslateLang] = useState<SupportedLanguage>("English")

    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

    useEffect(() => {
        const checkSettings = async () => {
            const activeProvider = await storage.get("active_provider") || "openrouter"
            const key = await storage.get(`${activeProvider}_key`)
            const rewriteLang = await storage.get("default_lang_rewrite")
            const translateLang = await storage.get("default_lang_translate")

            setApiKey(key)
            if (rewriteLang) setDefaultRewriteLang(rewriteLang as SupportedLanguage)
            if (translateLang) setDefaultTranslateLang(translateLang as SupportedLanguage)
            setIsSettingsLoaded(true)
        }
        if (isOpen) {
            checkSettings()
        } else {
            // Reset loaded state when closed so it re-checks next time
            setIsSettingsLoaded(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <>
            {/* Click-Outside Overlay */}
            <div
                className="plasmo-fixed plasmo-inset-0 plasmo-z-40 plasmo-bg-transparent"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={`plasmo-fixed plasmo-z-50 plasmo-w-[380px] plasmo-bg-black/60 plasmo-backdrop-blur-2xl plasmo-backdrop-saturate-150 plasmo-rounded-3xl plasmo-shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] plasmo-border plasmo-border-white/10 plasmo-flex plasmo-flex-col plasmo-overflow-hidden plasmo-animate-in plasmo-fade-in plasmo-zoom-in-95 plasmo-duration-200 plasmo-ease-out plasmo-transition-all plasmo-duration-300 plasmo-ease-in-out`}
                style={{
                    left: position.x,
                    top: position.y,
                    transform: `translate(-50%, ${placement === "top" ? "-100%" : "0"})`,
                    marginTop: placement === "bottom" ? "12px" : "0",
                    marginBottom: placement === "top" ? "12px" : "0",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
                }}>

                {isSettingsLoaded ? (
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
                        />
                    )
                ) : (
                    <div className="plasmo-p-8 plasmo-flex plasmo-items-center plasmo-justify-center">
                        <Loader2 className="plasmo-w-6 plasmo-h-6 plasmo-text-white/30 plasmo-animate-spin" />
                    </div>
                )}
            </div>
        </>
    )
}
