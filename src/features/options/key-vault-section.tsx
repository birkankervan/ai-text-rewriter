import { useState } from "react"
import { Shield, ChevronUp, ChevronDown, Check, Save, Key } from "lucide-react"
import { PROVIDERS } from "~lib/constants"

interface KeyVaultSectionProps {
    keys: Record<string, string>
    keyExists: Record<string, boolean>
    savedStatus: Record<string, boolean>
    handleKeyChange: (providerId: string, value: string) => void
    saveKey: (providerId: string) => void
}

export function KeyVaultSection({ keys, keyExists, savedStatus, handleKeyChange, saveKey }: KeyVaultSectionProps) {
    const [openAccordionId, setOpenAccordionId] = useState<string | null>(null)
    const [showKey, setShowKey] = useState<Record<string, boolean>>({})

    const toggleAccordion = (providerId: string) => {
        setOpenAccordionId(prev => prev === providerId ? null : providerId)
    }

    const toggleShowKey = (providerId: string) => {
        setShowKey(prev => ({ ...prev, [providerId]: !prev[providerId] }))
    }

    return (
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
    )
}
