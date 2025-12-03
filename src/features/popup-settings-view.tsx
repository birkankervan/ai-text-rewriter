import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { SUPPORTED_LANGUAGES } from "~lib/constants"
import { Settings, ExternalLink } from "lucide-react"
import type { TranslationProvider } from "~lib/llm-types"

const storage = new Storage()

export const PopupSettingsView = () => {
    const [defaultRewriteLang, setDefaultRewriteLang] = useState("Keep Original")
    const [defaultTranslateLang, setDefaultTranslateLang] = useState("English")
    const [translationProvider, setTranslationProvider] = useState<TranslationProvider>("free")
    const [status, setStatus] = useState("")

    useEffect(() => {
        const loadSettings = async () => {
            const rewriteLang = await storage.get("default_lang_rewrite")
            const translateLang = await storage.get("default_lang_translate")
            const provider = await storage.get("preferred_translation_provider") as TranslationProvider

            if (rewriteLang) setDefaultRewriteLang(rewriteLang)
            if (translateLang) setDefaultTranslateLang(translateLang)
            if (provider) setTranslationProvider(provider)
        }
        loadSettings()
    }, [])

    const handleSave = async () => {
        await storage.set("default_lang_rewrite", defaultRewriteLang)
        await storage.set("default_lang_translate", defaultTranslateLang)
        await storage.set("preferred_translation_provider", translationProvider)
        setStatus("Saved!")
        setTimeout(() => setStatus(""), 2000)
    }

    const openOptions = () => {
        chrome.runtime.openOptionsPage()
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-2.5 plasmo-p-1">
            {/* Default Rewrite Language */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <label className="plasmo-text-[10px] plasmo-font-semibold plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-uppercase plasmo-tracking-wider">
                    Rewrite Default
                </label>
                <select
                    value={defaultRewriteLang}
                    onChange={(e) => setDefaultRewriteLang(e.target.value)}
                    className="plasmo-w-full plasmo-p-1.5 plasmo-rounded-md plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-white dark:plasmo-bg-slate-800 plasmo-text-xs focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/20">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                            {lang}
                        </option>
                    ))}
                </select>
            </div>

            {/* Default Translate Language */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <label className="plasmo-text-[10px] plasmo-font-semibold plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-uppercase plasmo-tracking-wider">
                    Translate Default
                </label>
                <select
                    value={defaultTranslateLang}
                    onChange={(e) => setDefaultTranslateLang(e.target.value)}
                    className="plasmo-w-full plasmo-p-1.5 plasmo-rounded-md plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-white dark:plasmo-bg-slate-800 plasmo-text-xs focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/20">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                            {lang}
                        </option>
                    ))}
                </select>
            </div>

            {/* Translation Engine Toggle */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <label className="plasmo-text-[10px] plasmo-font-semibold plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-uppercase plasmo-tracking-wider">
                    Translate via
                </label>
                <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-1 plasmo-p-0.5 plasmo-bg-slate-100 dark:plasmo-bg-slate-800 plasmo-rounded-md">
                    <button
                        onClick={() => setTranslationProvider("ai")}
                        className={`plasmo-py-1.5 plasmo-px-2 plasmo-rounded plasmo-text-[10px] plasmo-font-bold plasmo-transition-all ${translationProvider === "ai"
                                ? "plasmo-bg-white dark:plasmo-bg-slate-700 plasmo-text-blue-600 dark:plasmo-text-blue-400 plasmo-shadow-sm"
                                : "plasmo-text-slate-500 dark:plasmo-text-slate-400"
                            }`}>
                        🤖 AI
                    </button>
                    <button
                        onClick={() => setTranslationProvider("free")}
                        className={`plasmo-py-1.5 plasmo-px-2 plasmo-rounded plasmo-text-[10px] plasmo-font-bold plasmo-transition-all ${translationProvider === "free"
                                ? "plasmo-bg-white dark:plasmo-bg-slate-700 plasmo-text-green-600 dark:plasmo-text-green-400 plasmo-shadow-sm"
                                : "plasmo-text-slate-500 dark:plasmo-text-slate-400"
                            }`}>
                        🌐 Free
                    </button>
                </div>
            </div>

            <button
                onClick={handleSave}
                className="plasmo-w-full plasmo-py-1.5 plasmo-bg-blue-600 hover:plasmo-bg-blue-700 plasmo-text-white plasmo-rounded-md plasmo-font-medium plasmo-text-xs plasmo-transition-colors plasmo-mt-1">
                {status || "Save Preferences"}
            </button>

            <div className="plasmo-pt-2 plasmo-border-t plasmo-border-slate-100 dark:plasmo-border-slate-800">
                <button
                    onClick={openOptions}
                    className="plasmo-w-full plasmo-py-1.5 plasmo-px-3 plasmo-rounded-md plasmo-bg-slate-50 dark:plasmo-bg-slate-800 hover:plasmo-bg-slate-100 dark:hover:plasmo-bg-slate-700 plasmo-text-slate-600 dark:plasmo-text-slate-300 plasmo-text-[10px] plasmo-font-medium plasmo-transition-colors plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2">
                    <Settings className="plasmo-w-3 plasmo-h-3" />
                    Configure Providers & Keys
                    <ExternalLink className="plasmo-w-2.5 plasmo-h-2.5 plasmo-opacity-50" />
                </button>
            </div>
        </div>
    )
}
