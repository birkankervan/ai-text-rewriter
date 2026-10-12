import { Loader2, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { storage } from "~lib/storage"
import type { SupportedLanguage } from "~lib/constants"
import TranslateView from "~features/translate-view"
import RewriteView from "~features/rewrite-view"
import { useAppearance } from "~hooks/use-appearance"
import { usePointerLighting } from "~hooks/use-pointer-lighting"

interface TranslationModalProps {
    isOpen: boolean
    onClose: () => void
    initialText: string
    position: { x: number; y: number }
    placement: "top" | "bottom"
    initialMode: "rewrite" | "translate"
    onReplace?: (text: string) => void
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
    onReplace
}: TranslationModalProps) => {
    const appearance = useAppearance()
    const pointerLighting = usePointerLighting(appearance.pointerLighting)
    const {
        isLoading,
        apiKey,
        defaultRewriteLang,
        defaultTranslateLang
    } = useTranslationSettings(isOpen)

    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) dialogRef.current?.focus()
    }, [isOpen])

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
            marginBottom: placement === "top" ? "12px" : "0",
            maxHeight: `${maxHeight}px`,
            maxWidth: "calc(100vw - 16px)",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
        } as const
    }, [position.x, position.y, placement])

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
                className={`apple-theme apple-glass pointer-surface ${appearance.className} ${appearance.pointerLighting ? "pointer-light-active" : ""} plasmo-fixed plasmo-z-50 plasmo-w-[380px] focus:plasmo-outline-none plasmo-rounded-[26px] plasmo-flex plasmo-flex-col plasmo-overflow-hidden`}
                style={modalStyle}
                role="dialog"
                aria-modal="true"
                aria-label={initialMode === "translate" ? "Translate selected text" : "Rewrite selected text"}
                tabIndex={-1}
                ref={dialogRef}
                onKeyDownCapture={(e) => { if (e.key === "Escape") onClose() }}
                {...pointerLighting}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="plasmo-absolute plasmo-top-2 plasmo-right-2 plasmo-z-10 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-w-6 plasmo-h-6 plasmo-rounded-full hover:plasmo-bg-black/10 focus-visible:plasmo-ring-2 focus-visible:plasmo-ring-blue-500">
                    <X className="apple-label plasmo-w-3 plasmo-h-3" />
                </button>
                <div className="plasmo-overflow-y-auto plasmo-flex-1 plasmo-w-full custom-scrollbar">
                    {!isLoading ? (
                        initialMode === "translate" ? (
                            <TranslateView
                                initialText={initialText}
                                apiKey={apiKey}
                                defaultTargetLang={defaultTranslateLang}
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
                            <Loader2 className="plasmo-w-6 plasmo-h-6 apple-muted plasmo-animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
