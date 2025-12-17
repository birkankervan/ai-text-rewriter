import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { Settings, Check } from "lucide-react"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "~lib/constants"
import type { TranslationProvider } from "~lib/llm-types"

const storage = new Storage()

// Helper Component: Default Language Selector
function DefaultLanguageSelector({ label, storageKey, defaultValue }: { label: string, storageKey: string, defaultValue: SupportedLanguage }) {
    const [value, setValue] = useState<SupportedLanguage>(defaultValue)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        const loadValue = async () => {
            const stored = await storage.get(storageKey) as SupportedLanguage
            if (stored) setValue(stored)
        }
        loadValue()
    }, [storageKey])

    const handleChange = async (newValue: SupportedLanguage) => {
        setValue(newValue)
        await storage.set(storageKey, newValue)
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-2">
            <label className="plasmo-text-sm plasmo-font-medium plasmo-text-slate-700 dark:plasmo-text-slate-300">
                {label}
            </label>
            <div className="plasmo-relative">
                <select
                    value={value}
                    onChange={(e) => handleChange(e.target.value as SupportedLanguage)}
                    className="plasmo-w-full plasmo-p-3 plasmo-rounded-xl plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-green-500/20 plasmo-transition-all">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                            {lang}
                        </option>
                    ))}
                </select>
                {saved && (
                    <div className="plasmo-absolute plasmo-right-3 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-text-green-500">
                        <Check className="plasmo-w-4 plasmo-h-4" />
                    </div>
                )}
            </div>
        </div>
    )
}

// Helper Component: Translation Provider Selector
function TranslationProviderSelector({ hasAnyKey }: { hasAnyKey: boolean }) {
    const [provider, setProvider] = useState<TranslationProvider>("free")
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            const stored = await storage.get("preferred_translation_provider") as TranslationProvider
            if (stored) setProvider(stored)
        }
        loadData()
    }, [])

    const handleChange = async (newProvider: TranslationProvider) => {
        if (newProvider === "ai" && !hasAnyKey) return
        setProvider(newProvider)
        await storage.set("preferred_translation_provider", newProvider)
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-3">
            <label className="plasmo-text-sm plasmo-font-medium plasmo-text-slate-700 dark:plasmo-text-slate-300">
                Preferred Translation Engine
            </label>
            <p className="plasmo-text-xs plasmo-text-slate-500">
                Choose which service to use for translations. Rewrite mode always uses AI providers.
            </p>

            <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3 plasmo-p-1 plasmo-bg-slate-100 dark:plasmo-bg-slate-800 plasmo-rounded-xl">
                <button
                    onClick={() => handleChange("ai")}
                    disabled={!hasAnyKey}
                    title={!hasAnyKey ? "Add an API key first to use AI translations" : "Use AI for high-quality translations"}
                    className={`plasmo-p-4 plasmo-rounded-lg plasmo-transition-all plasmo-text-left plasmo-relative ${!hasAnyKey
                        ? "plasmo-opacity-50 plasmo-cursor-not-allowed plasmo-bg-slate-200/50 dark:plasmo-bg-slate-700/30 plasmo-border-2 plasmo-border-dashed plasmo-border-slate-300 dark:plasmo-border-slate-600"
                        : provider === "ai"
                            ? "plasmo-bg-white dark:plasmo-bg-slate-700 plasmo-shadow-md plasmo-border-2 plasmo-border-blue-500"
                            : "plasmo-bg-transparent hover:plasmo-bg-white/50 dark:hover:plasmo-bg-slate-700/50 plasmo-border-2 plasmo-border-transparent"
                        }`}>
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-mb-1">
                        <span className="plasmo-text-base">{hasAnyKey ? "🤖" : "🔒"}</span>
                        <span className={`plasmo-font-semibold plasmo-text-sm ${hasAnyKey ? "plasmo-text-slate-900 dark:plasmo-text-white" : "plasmo-text-slate-400"}`}>AI Models</span>
                    </div>
                    <p className={`plasmo-text-xs ${hasAnyKey ? "plasmo-text-slate-500 dark:plasmo-text-slate-400" : "plasmo-text-slate-400"}`}>
                        {hasAnyKey ? "High quality, requires API key" : "Add API key to enable"}
                    </p>
                </button>

                <button
                    onClick={() => handleChange("free")}
                    className={`plasmo-p-4 plasmo-rounded-lg plasmo-transition-all plasmo-text-left ${provider === "free"
                        ? "plasmo-bg-white dark:plasmo-bg-slate-700 plasmo-shadow-md plasmo-border-2 plasmo-border-green-500"
                        : "plasmo-bg-transparent hover:plasmo-bg-white/50 dark:hover:plasmo-bg-slate-700/50 plasmo-border-2 plasmo-border-transparent"
                        }`}>
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-mb-1">
                        <span className="plasmo-text-base">🌐</span>
                        <span className="plasmo-font-semibold plasmo-text-sm plasmo-text-slate-900 dark:plasmo-text-white">Google Translate</span>
                    </div>
                    <p className="plasmo-text-xs plasmo-text-slate-500 dark:plasmo-text-slate-400">
                        Free, instant, no key needed
                    </p>
                </button>
            </div>

            {saved && (
                <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-text-green-600 dark:plasmo-text-green-400 plasmo-text-xs plasmo-font-medium">
                    <Check className="plasmo-w-3 plasmo-h-3" />
                    Saved successfully
                </div>
            )}
        </div>
    )
}

export function DefaultsSection({ hasAnyKey }: { hasAnyKey: boolean }) {
    return (
        <div className="plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-rounded-2xl plasmo-shadow-sm plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-800 plasmo-overflow-hidden">
            <div className="plasmo-p-6 plasmo-border-b plasmo-border-slate-100 dark:plasmo-border-slate-800">
                <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                    <div className="plasmo-p-2 plasmo-bg-green-50 dark:plasmo-bg-green-900/20 plasmo-rounded-lg">
                        <Settings className="plasmo-w-5 plasmo-h-5 plasmo-text-green-600 dark:plasmo-text-green-400" />
                    </div>
                    <div>
                        <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-slate-900 dark:plasmo-text-white">Defaults & Preferences</h2>
                        <p className="plasmo-text-sm plasmo-text-slate-500">Set default languages and preferred translation engine.</p>
                    </div>
                </div>
            </div>

            <div className="plasmo-p-6 plasmo-space-y-6">
                {/* Language Defaults */}
                <div className="plasmo-grid plasmo-grid-cols-1 md:plasmo-grid-cols-2 plasmo-gap-6">
                    <DefaultLanguageSelector
                        label="Default Rewrite Language"
                        storageKey="default_lang_rewrite"
                        defaultValue="Keep Original"
                    />
                    <DefaultLanguageSelector
                        label="Default Translate Language"
                        storageKey="default_lang_translate"
                        defaultValue="English"
                    />
                </div>

                {/* Translation Engine Preference */}
                <div className="plasmo-pt-4 plasmo-border-t plasmo-border-slate-100 dark:plasmo-border-slate-800">
                    <TranslationProviderSelector hasAnyKey={hasAnyKey} />
                </div>
            </div>
        </div>
    )
}
