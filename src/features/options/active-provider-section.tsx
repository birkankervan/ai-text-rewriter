import { Zap, Key } from "lucide-react"
import { PROVIDERS } from "~lib/constants"

interface ActiveProviderSectionProps {
    activeProvider: string
    keyExists: Record<string, boolean>
    model: string
    handleActiveProviderChange: (newProvider: string) => void
    handleModelChange: (newModel: string) => void
    activeKey: string
    currentModels: any[]
    loadingModels: boolean
    isModelMissing: boolean
}

export function ActiveProviderSection({
    activeProvider,
    keyExists,
    model,
    handleActiveProviderChange,
    handleModelChange,
    activeKey,
    currentModels,
    loadingModels,
    isModelMissing
}: ActiveProviderSectionProps) {
    const hasAnyKey = Object.values(keyExists).some(Boolean)

    return (
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
                {!hasAnyKey && (
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
                        <label className={`plasmo-text-sm plasmo-font-medium ${!hasAnyKey ? "plasmo-text-slate-400" : "plasmo-text-slate-700 dark:plasmo-text-slate-300"}`}>
                            Provider
                        </label>
                        <select
                            value={activeProvider}
                            onChange={(e) => handleActiveProviderChange(e.target.value)}
                            disabled={!hasAnyKey}
                            className={`plasmo-w-full plasmo-p-3 plasmo-rounded-xl plasmo-border plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 plasmo-transition-all ${!hasAnyKey
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
                        <label className={`plasmo-text-sm plasmo-font-medium ${!hasAnyKey
                            ? "plasmo-text-slate-400"
                            : isModelMissing && !loadingModels
                                ? "plasmo-text-red-500"
                                : "plasmo-text-slate-700 dark:plasmo-text-slate-300"
                            }`}>
                            Model {isModelMissing && !loadingModels && hasAnyKey && <span className="plasmo-text-xs plasmo-font-normal">— Please select a model</span>}
                        </label>
                        <select
                            value={model}
                            onChange={(e) => handleModelChange(e.target.value)}
                            disabled={!hasAnyKey || loadingModels || (activeProvider !== "openrouter" && !activeKey)}
                            className={`plasmo-w-full plasmo-p-3 plasmo-rounded-xl plasmo-border plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-sm focus:plasmo-outline-none focus:plasmo-ring-2 plasmo-transition-all ${!hasAnyKey
                                ? "plasmo-opacity-50 plasmo-cursor-not-allowed plasmo-border-slate-300 dark:plasmo-border-slate-600"
                                : isModelMissing && !loadingModels
                                    ? "plasmo-border-red-500 plasmo-border-2 focus:plasmo-ring-red-500/20 plasmo-animate-pulse"
                                    : "plasmo-border-slate-200 dark:plasmo-border-slate-700 focus:plasmo-ring-blue-500/20"
                                }`}>
                            <option value="">⚠️ Select a model...</option>
                            {loadingModels ? (
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
    )
}
