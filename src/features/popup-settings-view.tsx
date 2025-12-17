import { useState, useEffect, useCallback, useMemo } from "react"
import { Storage } from "@plasmohq/storage"
import { SUPPORTED_LANGUAGES } from "~lib/constants"
import { Settings, ExternalLink } from "lucide-react"
import type { TranslationProvider } from "~lib/llm-types"

const storage = new Storage()

interface PopupSettingsState {
    defaultRewriteLang: string
    defaultTranslateLang: string
    translationProvider: TranslationProvider
    hasAnyKey: boolean
}

const usePopupSettings = () => {
    const [settings, setSettings] = useState<PopupSettingsState>({
        defaultRewriteLang: "Keep Original",
        defaultTranslateLang: "English",
        translationProvider: "free",
        hasAnyKey: false
    })
    const [status, setStatus] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [
                    rewriteLang,
                    translateLang,
                    provider,
                    openRouterKey,
                    openaiKey,
                    geminiKey,
                    groqKey
                ] = await Promise.all([
                    storage.get("default_lang_rewrite"),
                    storage.get("default_lang_translate"),
                    storage.get("preferred_translation_provider"),
                    storage.get("openrouter_key"),
                    storage.get("openai_key"),
                    storage.get("gemini_key"),
                    storage.get("groq_key")
                ])

                const hasKey = !!(openRouterKey || openaiKey || geminiKey || groqKey)

                setSettings({
                    defaultRewriteLang: (rewriteLang as string) || "Keep Original",
                    defaultTranslateLang: (translateLang as string) || "English",
                    translationProvider: (provider as TranslationProvider) || "free",
                    hasAnyKey: hasKey
                })
            } catch (error) {
                console.error("Failed to load settings:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    const updateSetting = useCallback(<K extends keyof PopupSettingsState>(key: K, value: PopupSettingsState[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }, [])

    const saveSettings = useCallback(async () => {
        try {
            await Promise.all([
                storage.set("default_lang_rewrite", settings.defaultRewriteLang),
                storage.set("default_lang_translate", settings.defaultTranslateLang),
                storage.set("preferred_translation_provider", settings.translationProvider)
            ])
            setStatus("Saved!")
            setTimeout(() => setStatus(""), 2000)
        } catch (error) {
            console.error("Failed to save settings:", error)
            setStatus("Error")
        }
    }, [settings])

    return {
        settings,
        updateSetting,
        saveSettings,
        status,
        isLoading
    }
}

export const PopupSettingsView = () => {
    const { settings, updateSetting, saveSettings, status, isLoading } = usePopupSettings()

    // Memoize static lists to avoid re-mapping on every render
    const rewriteOptions = useMemo(() => (
        SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
                {lang}
            </option>
        ))
    ), [])

    const translateOptions = useMemo(() => (
        SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
                {lang}
            </option>
        ))
    ), [])

    const openOptions = useCallback(() => {
        chrome.runtime.openOptionsPage()
    }, [])

    if (isLoading) {
        return <div className="plasmo-h-[200px] plasmo-flex plasmo-items-center plasmo-justify-center">
            <div className="plasmo-w-5 plasmo-h-5 plasmo-border-2 plasmo-border-blue-500/30 plasmo-border-t-blue-500 plasmo-rounded-full plasmo-animate-spin" />
        </div>
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-2.5 plasmo-p-1">
            {/* Default Rewrite Language */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <label className="plasmo-text-[10px] plasmo-font-semibold plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-uppercase plasmo-tracking-wider">
                    Rewrite Default
                </label>
                <select
                    value={settings.defaultRewriteLang}
                    onChange={(e) => updateSetting("defaultRewriteLang", e.target.value)}
                    className="plasmo-w-full plasmo-p-1.5 plasmo-rounded-md plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-white dark:plasmo-bg-slate-800 plasmo-text-xs focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/20">
                    {rewriteOptions}
                </select>
            </div>

            {/* Default Translate Language */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <label className="plasmo-text-[10px] plasmo-font-semibold plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-uppercase plasmo-tracking-wider">
                    Translate Default
                </label>
                <select
                    value={settings.defaultTranslateLang}
                    onChange={(e) => updateSetting("defaultTranslateLang", e.target.value)}
                    className="plasmo-w-full plasmo-p-1.5 plasmo-rounded-md plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-white dark:plasmo-bg-slate-800 plasmo-text-xs focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/20">
                    {translateOptions}
                </select>
            </div>

            {/* Translation Engine Toggle */}
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                <label className="plasmo-text-[10px] plasmo-font-semibold plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-uppercase plasmo-tracking-wider">
                    Translate via
                </label>
                <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-1 plasmo-p-0.5 plasmo-bg-slate-100 dark:plasmo-bg-slate-800 plasmo-rounded-md">
                    <button
                        onClick={() => settings.hasAnyKey && updateSetting("translationProvider", "ai")}
                        disabled={!settings.hasAnyKey}
                        title={!settings.hasAnyKey ? "Add API key to enable AI translations" : "Use AI for high-quality translations"}
                        className={`plasmo-py-1.5 plasmo-px-2 plasmo-rounded plasmo-text-[10px] plasmo-font-bold plasmo-transition-all ${!settings.hasAnyKey
                            ? "plasmo-opacity-40 plasmo-cursor-not-allowed plasmo-text-slate-400"
                            : settings.translationProvider === "ai"
                                ? "plasmo-bg-white dark:plasmo-bg-slate-700 plasmo-text-blue-600 dark:plasmo-text-blue-400 plasmo-shadow-sm"
                                : "plasmo-text-slate-500 dark:plasmo-text-slate-400 hover:plasmo-bg-white/50"
                            }`}>
                        {settings.hasAnyKey ? "🤖" : "🔒"} AI
                    </button>
                    <button
                        onClick={() => updateSetting("translationProvider", "free")}
                        className={`plasmo-py-1.5 plasmo-px-2 plasmo-rounded plasmo-text-[10px] plasmo-font-bold plasmo-transition-all ${settings.translationProvider === "free"
                            ? "plasmo-bg-white dark:plasmo-bg-slate-700 plasmo-text-green-600 dark:plasmo-text-green-400 plasmo-shadow-sm"
                            : "plasmo-text-slate-500 dark:plasmo-text-slate-400 hover:plasmo-bg-white/50"
                            }`}>
                        🌐 Free
                    </button>
                </div>
            </div>

            <button
                onClick={saveSettings}
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
