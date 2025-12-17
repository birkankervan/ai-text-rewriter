import { useState, useEffect } from "react"
import iconSrc from "url:~assets/icon.png"


import { Storage } from "@plasmohq/storage"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HistoryTable } from "~features/history-table"
import { Settings, History, LayoutGrid, Key, Check, Save, Zap, Shield, ChevronDown, ChevronUp, ExternalLink, BookOpen, LifeBuoy } from "lucide-react"
import { useOpenAIModels, useOpenRouterModels, useGeminiModels, useGroqModels } from "~hooks/use-models"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "~lib/constants"
import type { TranslationProvider } from "~lib/llm-types"
import "./style.css"

const storage = new Storage()
const queryClient = new QueryClient()

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


const PROVIDERS = [
    { id: "openrouter", name: "OpenRouter", description: "Access top models like GPT-4, Claude 3, and Llama 3 via one API." },
    { id: "openai", name: "OpenAI", description: "Direct access to GPT-4 and GPT-3.5 Turbo models." },
    { id: "gemini", name: "Google Gemini", description: "Google's latest multimodal models including Gemini 1.5 Pro/Flash." },
    { id: "groq", name: "Groq", description: "Ultra-fast inference for open-source models like Llama 3 and Mixtral." }
]

const DEFAULTS = {
    openrouter: "google/gemini-2.0-flash-exp:free",
    openai: "gpt-4o-mini",
    gemini: "gemini-1.5-flash",
    groq: "llama3-8b-8192"
}

function OptionsContent() {
    const [activeTab, setActiveTab] = useState<"settings" | "history">("settings")
    const [activeProvider, setActiveProvider] = useState("openrouter")
    const [keys, setKeys] = useState<Record<string, string>>({})
    const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({})
    const [showKey, setShowKey] = useState<Record<string, boolean>>({})

    // New State for UX Refinement
    const [keyExists, setKeyExists] = useState<Record<string, boolean>>({})
    const [openAccordionId, setOpenAccordionId] = useState<string | null>(null)

    // Model state
    const [model, setModel] = useState("")

    // Model hooks
    const activeKey = keys[activeProvider] || ""

    const { data: openRouterModels, isLoading: isLoadingOpenRouter } = useOpenRouterModels()
    const { data: openAIModels, isLoading: isLoadingOpenAI } = useOpenAIModels(activeProvider === "openai" ? activeKey : "")
    const { data: geminiModels, isLoading: isLoadingGemini } = useGeminiModels(activeProvider === "gemini" ? activeKey : "")
    const { data: groqModels, isLoading: isLoadingGroq } = useGroqModels(activeProvider === "groq" ? activeKey : "")

    useEffect(() => {
        const loadSettings = async () => {
            // Load active provider
            const savedActiveProvider = await storage.get("active_provider") || "openrouter"
            setActiveProvider(savedActiveProvider)

            // Load all keys and check existence
            const loadedKeys: Record<string, string> = {}
            const existence: Record<string, boolean> = {}

            for (const p of PROVIDERS) {
                const k = await storage.get(`${p.id}_key`)
                if (k) {
                    loadedKeys[p.id] = k
                    existence[p.id] = true
                } else {
                    existence[p.id] = false
                }
            }
            setKeys(loadedKeys)
            setKeyExists(existence)

            // Load model for active provider
            const savedModel = await storage.get(`${savedActiveProvider}_model`)
            setModel(savedModel || DEFAULTS[savedActiveProvider as keyof typeof DEFAULTS])
        }
        loadSettings()
    }, [])

    const handleActiveProviderChange = async (newProvider: string) => {
        setActiveProvider(newProvider)
        await storage.set("active_provider", newProvider)

        // Load model for the new provider
        const savedModel = await storage.get(`${newProvider}_model`)
        setModel(savedModel || DEFAULTS[newProvider as keyof typeof DEFAULTS])
    }

    const handleKeyChange = (providerId: string, value: string) => {
        setKeys(prev => ({ ...prev, [providerId]: value }))
        setSavedStatus(prev => ({ ...prev, [providerId]: false }))
    }

    const saveKey = async (providerId: string) => {
        const value = keys[providerId]
        await storage.set(`${providerId}_key`, value)

        // Update existence state
        const newKeyExists = { ...keyExists, [providerId]: !!value }
        setKeyExists(newKeyExists)

        // AUTO-SELECT LOGIC: If we just saved a NEW key
        if (value) {
            // Check how many keys existed BEFORE this save
            const previousKeyCount = Object.values(keyExists).filter(Boolean).length
            const isFirstKey = previousKeyCount === 0

            // Auto-switch to this provider
            setActiveProvider(providerId)
            await storage.set("active_provider", providerId)

            // Set default model for this provider
            const defaultModel = DEFAULTS[providerId as keyof typeof DEFAULTS]
            setModel(defaultModel)
            await storage.set(`${providerId}_model`, defaultModel)

            // If first key: also set translation engine to AI
            if (isFirstKey) {
                await storage.set("preferred_translation_provider", "ai")
            }
        }

        // Handle key REMOVAL: if user deletes the currently active provider's key
        if (!value && activeProvider === providerId) {
            // Find next provider with a key
            const nextProvider = PROVIDERS.find(p => p.id !== providerId && newKeyExists[p.id])
            if (nextProvider) {
                setActiveProvider(nextProvider.id)
                await storage.set("active_provider", nextProvider.id)
                const nextModel = await storage.get(`${nextProvider.id}_model`) || DEFAULTS[nextProvider.id as keyof typeof DEFAULTS]
                setModel(nextModel)
            } else {
                // No other keys - reset to openrouter (works without key for free models)
                setActiveProvider("openrouter")
                await storage.set("active_provider", "openrouter")
                setModel(DEFAULTS.openrouter)
            }
        }

        setSavedStatus(prev => ({ ...prev, [providerId]: true }))
        setTimeout(() => {
            setSavedStatus(prev => ({ ...prev, [providerId]: false }))
        }, 2000)
    }

    const toggleShowKey = (providerId: string) => {
        setShowKey(prev => ({ ...prev, [providerId]: !prev[providerId] }))
    }

    const toggleAccordion = (providerId: string) => {
        setOpenAccordionId(prev => prev === providerId ? null : providerId)
    }

    const handleModelChange = async (newModel: string) => {
        setModel(newModel)
        await storage.set(`${activeProvider}_model`, newModel)
    }

    const getModels = () => {
        switch (activeProvider) {
            case "openrouter": return openRouterModels || []
            case "openai": return openAIModels || []
            case "gemini": return geminiModels || []
            case "groq": return groqModels || []
            default: return []
        }
    }

    const isLoadingModels = () => {
        switch (activeProvider) {
            case "openrouter": return isLoadingOpenRouter
            case "openai": return isLoadingOpenAI && !!activeKey
            case "gemini": return isLoadingGemini && !!activeKey
            case "groq": return isLoadingGroq && !!activeKey
            default: return false
        }
    }

    const currentModels = getModels()
    const loading = isLoadingModels()
    const isModelMissing = !model || (currentModels.length > 0 && !currentModels.find((m: any) => m.id === model))

    // Auto-select first model when models are loaded and no valid model is selected
    useEffect(() => {
        const autoSelectModel = async () => {
            if (!loading && currentModels.length > 0 && isModelMissing) {
                const firstModel = currentModels[0]
                if (firstModel) {
                    setModel(firstModel.id)
                    await storage.set(`${activeProvider}_model`, firstModel.id)
                }
            }
        }
        autoSelectModel()
    }, [currentModels, loading, activeProvider])

    return (
        <div className="plasmo-min-h-screen plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-slate-900 dark:plasmo-text-slate-100 plasmo-flex" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
            {/* Sidebar */}
            <div className="plasmo-w-72 plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-border-r plasmo-border-slate-200 dark:plasmo-border-slate-800 plasmo-flex plasmo-flex-col plasmo-fixed plasmo-h-full">
                <div className="plasmo-p-6">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-mb-8">
                        <div className="plasmo-w-8 plasmo-h-8 plasmo-min-w-[32px] plasmo-rounded-lg plasmo-overflow-hidden plasmo-shadow-sm">
                            <img src={iconSrc} alt="Logo" className="plasmo-w-full plasmo-h-full plasmo-object-cover" />
                        </div>
                        <span className="plasmo-font-bold plasmo-text-base plasmo-tracking-tight plasmo-text-slate-900 dark:plasmo-text-white plasmo-whitespace-nowrap">
                            Smart Translate & Rewrite
                        </span>
                    </div>

                    <nav className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                        <button
                            onClick={() => setActiveTab("settings")}
                            className={`plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-px-4 plasmo-py-3 plasmo-rounded-xl plasmo-text-sm plasmo-font-medium plasmo-transition-all ${activeTab === "settings"
                                ? "plasmo-bg-blue-50 dark:plasmo-bg-blue-900/20 plasmo-text-blue-600 dark:plasmo-text-blue-400"
                                : "plasmo-text-slate-600 dark:plasmo-text-slate-400 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800"
                                }`}>
                            <Settings className="plasmo-w-4 plasmo-h-4" />
                            Settings
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-px-4 plasmo-py-3 plasmo-rounded-xl plasmo-text-sm plasmo-font-medium plasmo-transition-all ${activeTab === "history"
                                ? "plasmo-bg-purple-50 dark:plasmo-bg-purple-900/20 plasmo-text-purple-600 dark:plasmo-text-purple-400"
                                : "plasmo-text-slate-600 dark:plasmo-text-slate-400 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800"
                                }`}>
                            <History className="plasmo-w-4 plasmo-h-4" />
                            History
                        </button>
                    </nav>


                    <div className="plasmo-mt-auto plasmo-pt-8 plasmo-border-t plasmo-border-slate-200 dark:plasmo-border-slate-800">
                        <h3 className="plasmo-text-xs plasmo-font-semibold plasmo-text-slate-400 plasmo-uppercase plasmo-tracking-wider plasmo-mb-3">
                            Resources
                        </h3>
                        <nav className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                            <a
                                href="https://birkankervan.github.io/ai-text-rewriter/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-text-slate-600 dark:plasmo-text-slate-400 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800 plasmo-transition-all">
                                <ExternalLink className="plasmo-w-4 plasmo-h-4" />
                                Project Home
                            </a>
                            <a
                                href="https://birkankervan.github.io/ai-text-rewriter/setup.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-text-slate-600 dark:plasmo-text-slate-400 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800 plasmo-transition-all">
                                <BookOpen className="plasmo-w-4 plasmo-h-4" />
                                Setup Guide
                            </a>
                            <a
                                href="https://birkankervan.github.io/ai-text-rewriter/PRIVACY_POLICY"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-text-slate-600 dark:plasmo-text-slate-400 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800 plasmo-transition-all">
                                <Shield className="plasmo-w-4 plasmo-h-4" />
                                Privacy Policy
                            </a>
                            <a
                                href="mailto:e.birkankervan@gmail.com"
                                className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-text-slate-600 dark:plasmo-text-slate-400 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800 plasmo-transition-all">
                                <LifeBuoy className="plasmo-w-4 plasmo-h-4" />
                                Support
                            </a>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="plasmo-flex-1 plasmo-ml-72 plasmo-p-8">
                <div className="plasmo-max-w-4xl plasmo-mx-auto">
                    <header className="plasmo-mb-8">
                        <h1 className="plasmo-text-2xl plasmo-font-bold plasmo-text-slate-900 dark:plasmo-text-white">
                            {activeTab === "settings" ? "Extension Settings" : "Activity History"}
                        </h1>
                        <p className="plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-mt-1">
                            {activeTab === "settings"
                                ? "Configure your AI providers and keys."
                                : "View your past translations and rewrites."}
                        </p>
                    </header>

                    {activeTab === "settings" ? (
                        <div className="plasmo-flex plasmo-flex-col plasmo-gap-8">

                            {/* Section A: Defaults & Preferences (MOVED TO TOP) */}
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
                                        <TranslationProviderSelector hasAnyKey={Object.values(keyExists).some(Boolean)} />
                                    </div>
                                </div>
                            </div>

                            {/* Section B: General Settings (Active Provider) */}
                            <div className="plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-rounded-2xl plasmo-shadow-sm plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-800 plasmo-overflow-hidden">
                                <div className="plasmo-p-6 plasmo-border-b plasmo-border-slate-100 dark:plasmo-border-slate-800">
                                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                                        <div className="plasmo-p-2 plasmo-bg-blue-50 dark:plasmo-bg-blue-900/20 plasmo-rounded-lg">
                                            <Zap className="plasmo-w-5 plasmo-h-5 plasmo-text-blue-600 dark:plasmo-text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-slate-900 dark:plasmo-text-white">Active Provider</h2>
                                            <p className="plasmo-text-sm plasmo-text-slate-500">Select which AI service to use for rewrites and translations.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="plasmo-p-6 plasmo-flex plasmo-flex-col plasmo-gap-6">
                                    {/* No API Key Warning */}
                                    {!Object.values(keyExists).some(Boolean) && (
                                        <div className="plasmo-p-4 plasmo-rounded-xl plasmo-bg-amber-500/10 plasmo-border plasmo-border-amber-500/30">
                                            <div className="plasmo-flex plasmo-items-start plasmo-gap-3">
                                                <div className="plasmo-p-2 plasmo-bg-amber-500/20 plasmo-rounded-lg plasmo-mt-0.5">
                                                    <Key className="plasmo-w-4 plasmo-h-4 plasmo-text-amber-500" />
                                                </div>
                                                <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                                                    <h3 className="plasmo-font-semibold plasmo-text-amber-600 dark:plasmo-text-amber-400 plasmo-text-sm">API Key Required</h3>
                                                    <p className="plasmo-text-xs plasmo-text-slate-600 dark:plasmo-text-slate-400 plasmo-leading-relaxed">
                                                        <strong>Rewrite</strong> always requires an API key to function.
                                                        <br />
                                                        <strong>Translate</strong> can use free Google Translate, but for AI-powered translations, a key is needed.
                                                    </p>
                                                    <p className="plasmo-text-xs plasmo-text-amber-600 dark:plasmo-text-amber-400 plasmo-font-medium plasmo-mt-1">
                                                        👇 Add your API key in the section below to get started.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="plasmo-grid plasmo-grid-cols-1 md:plasmo-grid-cols-2 plasmo-gap-6">
                                        <div className="plasmo-flex plasmo-flex-col plasmo-gap-2">
                                            <label className={`plasmo-text-sm plasmo-font-medium ${!Object.values(keyExists).some(Boolean) ? "plasmo-text-slate-400" : "plasmo-text-slate-700 dark:plasmo-text-slate-300"}`}>
                                                Provider
                                            </label>
                                            <select
                                                value={activeProvider}
                                                onChange={(e) => handleActiveProviderChange(e.target.value)}
                                                disabled={!Object.values(keyExists).some(Boolean)}
                                                className={`plasmo-w-full plasmo-p-3 plasmo-rounded-xl plasmo-border plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 plasmo-transition-all ${!Object.values(keyExists).some(Boolean)
                                                    ? "plasmo-opacity-50 plasmo-cursor-not-allowed plasmo-border-slate-300 dark:plasmo-border-slate-600"
                                                    : "plasmo-border-slate-200 dark:plasmo-border-slate-700 focus:plasmo-ring-blue-500/20"
                                                    }`}>
                                                {PROVIDERS.map(p => (
                                                    <option key={p.id} value={p.id} disabled={!keyExists[p.id]}>
                                                        {p.name} {!keyExists[p.id] ? "(No Key Set)" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="plasmo-text-xs plasmo-text-slate-500">
                                                Only providers with saved keys can be selected.
                                            </p>
                                        </div>

                                        <div className="plasmo-flex plasmo-flex-col plasmo-gap-2">
                                            <label className={`plasmo-text-sm plasmo-font-medium ${!Object.values(keyExists).some(Boolean)
                                                ? "plasmo-text-slate-400"
                                                : isModelMissing && !loading
                                                    ? "plasmo-text-red-500"
                                                    : "plasmo-text-slate-700 dark:plasmo-text-slate-300"
                                                }`}>
                                                Model {isModelMissing && !loading && Object.values(keyExists).some(Boolean) && <span className="plasmo-text-xs plasmo-font-normal">— Please select a model</span>}
                                            </label>
                                            <select
                                                value={model}
                                                onChange={(e) => handleModelChange(e.target.value)}
                                                disabled={!Object.values(keyExists).some(Boolean) || loading || (activeProvider !== "openrouter" && !activeKey)}
                                                className={`plasmo-w-full plasmo-p-3 plasmo-rounded-xl plasmo-border plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 plasmo-transition-all ${!Object.values(keyExists).some(Boolean)
                                                    ? "plasmo-opacity-50 plasmo-cursor-not-allowed plasmo-border-slate-300 dark:plasmo-border-slate-600"
                                                    : isModelMissing && !loading
                                                        ? "plasmo-border-red-500 plasmo-border-2 focus:plasmo-ring-red-500/20 plasmo-animate-pulse"
                                                        : "plasmo-border-slate-200 dark:plasmo-border-slate-700 focus:plasmo-ring-blue-500/20"
                                                    }`}>
                                                <option value="">⚠️ Select a model...</option>
                                                {loading ? (
                                                    <option>Loading models...</option>
                                                ) : (
                                                    currentModels.map((m: any) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.pricing?.prompt === "0" ? "🆓 " : ""}{m.name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section C: API Key Vault (Accordion) */}
                            <div className="plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-rounded-2xl plasmo-shadow-sm plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-800 plasmo-overflow-hidden">
                                <div className="plasmo-p-6 plasmo-border-b plasmo-border-slate-100 dark:plasmo-border-slate-800">
                                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                                        <div className="plasmo-p-2 plasmo-bg-purple-50 dark:plasmo-bg-purple-900/20 plasmo-rounded-lg">
                                            <Shield className="plasmo-w-5 plasmo-h-5 plasmo-text-purple-600 dark:plasmo-text-purple-400" />
                                        </div>
                                        <div>
                                            <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-slate-900 dark:plasmo-text-white">API Key Vault</h2>
                                            <p className="plasmo-text-sm plasmo-text-slate-500">
                                                Securely store your API keys.
                                                <a href="https://birkankervan.github.io/ai-text-rewriter/setup.html" target="_blank" className="plasmo-text-blue-500 hover:plasmo-underline plasmo-ml-1">
                                                    Where do I get keys?
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="plasmo-divide-y plasmo-divide-slate-100 dark:plasmo-divide-slate-800">
                                    {PROVIDERS.map(p => {
                                        const isOpen = openAccordionId === p.id
                                        const hasKey = keyExists[p.id]

                                        return (
                                            <div key={p.id} className="plasmo-flex plasmo-flex-col plasmo-transition-all">
                                                {/* Accordion Header */}
                                                <button
                                                    onClick={() => toggleAccordion(p.id)}
                                                    className="plasmo-w-full plasmo-p-6 plasmo-flex plasmo-items-center plasmo-justify-between hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800/50 plasmo-transition-colors plasmo-text-left">

                                                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                                                        <div className={`plasmo-w-2 plasmo-h-2 plasmo-rounded-full ${hasKey ? "plasmo-bg-green-500" : "plasmo-bg-slate-300 dark:plasmo-bg-slate-700"}`} />
                                                        <div>
                                                            <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                                                                <h3 className="plasmo-font-medium plasmo-text-slate-900 dark:plasmo-text-white">{p.name}</h3>
                                                            </div>
                                                            <p className="plasmo-text-xs plasmo-text-slate-500 plasmo-mt-0.5">
                                                                {hasKey ? "Key saved" : "No key saved"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                                                        {isOpen ? (
                                                            <ChevronUp className="plasmo-w-5 plasmo-h-5 plasmo-text-slate-400" />
                                                        ) : (
                                                            <ChevronDown className="plasmo-w-5 plasmo-h-5 plasmo-text-slate-400" />
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Accordion Content */}
                                                {isOpen && (
                                                    <div className="plasmo-px-6 plasmo-pb-6 plasmo-animate-in plasmo-slide-in-from-top-2 plasmo-duration-200">
                                                        <div className="plasmo-p-4 plasmo-bg-slate-50 dark:plasmo-bg-slate-800/50 plasmo-rounded-xl plasmo-border plasmo-border-slate-100 dark:plasmo-border-slate-800">
                                                            <p className="plasmo-text-xs plasmo-text-slate-500 plasmo-mb-3">{p.description}</p>

                                                            <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                                                                <div className="plasmo-relative plasmo-flex-1">
                                                                    <div className="plasmo-absolute plasmo-left-3 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-text-slate-400">
                                                                        <Key className="plasmo-w-4 plasmo-h-4" />
                                                                    </div>
                                                                    <input
                                                                        type={showKey[p.id] ? "text" : "password"}
                                                                        value={keys[p.id] || ""}
                                                                        onChange={(e) => handleKeyChange(p.id, e.target.value)}
                                                                        placeholder={`Enter ${p.name} API Key`}
                                                                        className="plasmo-w-full plasmo-pl-10 plasmo-pr-10 plasmo-py-2.5 plasmo-rounded-xl plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-purple-500/20 plasmo-transition-all"
                                                                    />
                                                                    <button
                                                                        onClick={() => toggleShowKey(p.id)}
                                                                        className="plasmo-absolute plasmo-right-3 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-text-xs plasmo-font-medium plasmo-text-slate-400 hover:plasmo-text-slate-600 dark:hover:plasmo-text-slate-300">
                                                                        {showKey[p.id] ? "Hide" : "Show"}
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    onClick={() => saveKey(p.id)}
                                                                    className={`plasmo-p-2.5 plasmo-rounded-xl plasmo-transition-all ${savedStatus[p.id]
                                                                        ? "plasmo-bg-green-500 plasmo-text-white"
                                                                        : "plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-text-slate-600 dark:plasmo-text-slate-400 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800"
                                                                        }`}
                                                                    title="Save Key">
                                                                    {savedStatus[p.id] ? (
                                                                        <Check className="plasmo-w-5 plasmo-h-5" />
                                                                    ) : (
                                                                        <Save className="plasmo-w-5 plasmo-h-5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="plasmo-h-[600px]">
                            <HistoryTable />
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}

function Options() {
    return (
        <QueryClientProvider client={queryClient}>
            <OptionsContent />
        </QueryClientProvider>
    )
}

export default Options
