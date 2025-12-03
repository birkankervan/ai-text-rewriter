import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HistoryTable } from "~features/history-table"
import { Settings, History, LayoutGrid, Key, Check, Save, Zap, Shield, ChevronDown, ChevronUp } from "lucide-react"
import { useOpenAIModels, useOpenRouterModels, useGeminiModels, useGroqModels } from "~hooks/use-models"
import "./style.css"

const storage = new Storage()
const queryClient = new QueryClient()

const PROVIDERS = [
    { id: "openrouter", name: "OpenRouter", description: "Access top models like GPT-4, Claude 3, and Llama 3 via one API.", recommended: true },
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
        setKeyExists(prev => ({ ...prev, [providerId]: !!value }))

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

    return (
        <div className="plasmo-min-h-screen plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-slate-900 dark:plasmo-text-slate-100 plasmo-flex" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
            {/* Sidebar */}
            <div className="plasmo-w-64 plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-border-r plasmo-border-slate-200 dark:plasmo-border-slate-800 plasmo-flex plasmo-flex-col plasmo-fixed plasmo-h-full">
                <div className="plasmo-p-6">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-mb-8">
                        <div className="plasmo-w-8 plasmo-h-8 plasmo-rounded-lg plasmo-bg-gradient-to-br plasmo-from-blue-500 plasmo-to-purple-600 plasmo-flex plasmo-items-center plasmo-justify-center">
                            <LayoutGrid className="plasmo-w-5 plasmo-h-5 plasmo-text-white" />
                        </div>
                        <span className="plasmo-font-bold plasmo-text-lg">AI Rewriter</span>
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
                </div>
            </div>

            {/* Main Content */}
            <div className="plasmo-flex-1 plasmo-ml-64 plasmo-p-8">
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

                            {/* Section A: General Settings (Active Provider) */}
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

                                <div className="plasmo-p-6 plasmo-grid plasmo-grid-cols-1 md:plasmo-grid-cols-2 plasmo-gap-6">
                                    <div className="plasmo-flex plasmo-flex-col plasmo-gap-2">
                                        <label className="plasmo-text-sm plasmo-font-medium plasmo-text-slate-700 dark:plasmo-text-slate-300">
                                            Provider
                                        </label>
                                        <select
                                            value={activeProvider}
                                            onChange={(e) => handleActiveProviderChange(e.target.value)}
                                            className="plasmo-w-full plasmo-p-3 plasmo-rounded-xl plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/20 plasmo-transition-all">
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
                                        <label className="plasmo-text-sm plasmo-font-medium plasmo-text-slate-700 dark:plasmo-text-slate-300">
                                            Model
                                        </label>
                                        <select
                                            value={model}
                                            onChange={(e) => handleModelChange(e.target.value)}
                                            disabled={loading || (activeProvider !== "openrouter" && !activeKey)}
                                            className="plasmo-w-full plasmo-p-3 plasmo-rounded-xl plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/20 disabled:plasmo-opacity-50 plasmo-transition-all">
                                            <option value="">Select a model...</option>
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

                            {/* Section B: API Key Vault (Accordion) */}
                            <div className="plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-rounded-2xl plasmo-shadow-sm plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-800 plasmo-overflow-hidden">
                                <div className="plasmo-p-6 plasmo-border-b plasmo-border-slate-100 dark:plasmo-border-slate-800">
                                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                                        <div className="plasmo-p-2 plasmo-bg-purple-50 dark:plasmo-bg-purple-900/20 plasmo-rounded-lg">
                                            <Shield className="plasmo-w-5 plasmo-h-5 plasmo-text-purple-600 dark:plasmo-text-purple-400" />
                                        </div>
                                        <div>
                                            <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-slate-900 dark:plasmo-text-white">API Key Vault</h2>
                                            <p className="plasmo-text-sm plasmo-text-slate-500">Securely store your API keys. Keys are saved locally in your browser.</p>
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
                                                                {p.recommended && (
                                                                    <span className="plasmo-px-2 plasmo-py-0.5 plasmo-rounded-full plasmo-bg-green-100 dark:plasmo-bg-green-900/30 plasmo-text-green-600 dark:plasmo-text-green-400 plasmo-text-[10px] plasmo-font-bold plasmo-uppercase">
                                                                        Recommended
                                                                    </span>
                                                                )}
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
        </div>
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
