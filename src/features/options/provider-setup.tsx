import { useState } from "react"
import { ArrowUpRight, ChevronDown, Loader2 } from "lucide-react"
import { PROVIDERS } from "~lib/constants"

interface ProviderSetupProps {
    activeProvider: string
    keys: Record<string, string>
    keyExists: Record<string, boolean>
    model: string
    currentModels: any[]
    loadingModels: boolean
    isModelMissing: boolean
    handleActiveProviderChange: (providerId: string) => Promise<void>
    handleKeyChange: (providerId: string, value: string) => void
    saveKey: (providerId: string, value?: string) => Promise<void>
    handleModelChange: (model: string) => void
}

// One flow: pick a provider, connect its key, choose its model.
export function ProviderSetup({
    activeProvider,
    keys,
    keyExists,
    model,
    currentModels,
    loadingModels,
    isModelMissing,
    handleActiveProviderChange,
    handleKeyChange,
    saveKey,
    handleModelChange
}: ProviderSetupProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [editing, setEditing] = useState(false)
    const [showKey, setShowKey] = useState(false)

    const selected = PROVIDERS.find(p => p.id === (selectedId ?? activeProvider)) ?? PROVIDERS[0]
    const hasKey = !!keyExists[selected.id]
    const isActive = hasKey && selected.id === activeProvider
    const keyValue = keys[selected.id] || ""
    const showKeyForm = !hasKey || editing

    const selectProvider = (providerId: string) => {
        setSelectedId(providerId)
        setEditing(false)
        setShowKey(false)
        // Choosing a connected provider is the explicit switch; unconnected ones activate on Connect.
        if (keyExists[providerId] && providerId !== activeProvider) handleActiveProviderChange(providerId)
    }

    const connect = async () => {
        if (!keyValue.trim()) return
        await saveKey(selected.id)
        await handleActiveProviderChange(selected.id)
        setEditing(false)
        setShowKey(false)
    }

    const statusFor = (providerId: string) => {
        if (!keyExists[providerId]) return "Not connected"
        return providerId === activeProvider ? "In use" : "Connected"
    }

    return (
        <section aria-labelledby="provider-heading" className="plasmo-flex plasmo-flex-col plasmo-gap-4">
            <div>
                <h2 id="provider-heading" className="apple-label plasmo-text-xl plasmo-font-semibold plasmo-tracking-tight">AI provider</h2>
                <p className="apple-muted plasmo-mt-1 plasmo-text-sm">Rewrite and AI translation use this provider and your own API key.</p>
            </div>

            <div className="apple-card settings-group">
                <div role="radiogroup" aria-labelledby="provider-heading" className="provider-grid">
                    {PROVIDERS.map(p => {
                        const checked = p.id === selected.id
                        return (
                            <button
                                key={p.id}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                onClick={() => selectProvider(p.id)}
                                className="provider-option plasmo-flex plasmo-items-start plasmo-gap-3 plasmo-p-4 plasmo-text-left">
                                <span className="provider-radio" aria-hidden="true" />
                                <span className="plasmo-min-w-0">
                                    <span className="apple-label plasmo-block plasmo-text-sm plasmo-font-semibold">{p.name}</span>
                                    <span className={`plasmo-mt-0.5 plasmo-block plasmo-text-xs ${keyExists[p.id] ? "provider-status-on" : "apple-muted"}`}>
                                        {statusFor(p.id)}
                                    </span>
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className="settings-divider plasmo-flex plasmo-flex-col plasmo-gap-5 plasmo-p-5">
                    <p className="apple-muted plasmo-text-sm">{selected.description}</p>

                    {/* Step: API key */}
                    {showKeyForm ? (
                        <form
                            className="plasmo-flex plasmo-flex-col plasmo-gap-2"
                            onSubmit={(e) => { e.preventDefault(); connect() }}>
                            <label htmlFor="provider-key" className="apple-label plasmo-text-sm plasmo-font-medium">
                                {selected.name} API key
                            </label>
                            <div className="plasmo-flex plasmo-gap-2 max-sm:plasmo-flex-col">
                                <div className="plasmo-relative plasmo-flex-1">
                                    <input
                                        id="provider-key"
                                        type={showKey ? "text" : "password"}
                                        value={keyValue}
                                        onChange={(e) => handleKeyChange(selected.id, e.target.value)}
                                        placeholder="Paste your key"
                                        autoComplete="off"
                                        spellCheck={false}
                                        className="apple-field plasmo-h-11 plasmo-w-full plasmo-pl-3 plasmo-pr-16 plasmo-text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(v => !v)}
                                        aria-pressed={showKey}
                                        className="apple-muted plasmo-absolute plasmo-right-1 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-rounded-lg plasmo-px-3 plasmo-py-2 plasmo-text-xs plasmo-font-medium">
                                        {showKey ? "Hide" : "Show"}
                                    </button>
                                </div>
                                <button type="submit" disabled={!keyValue.trim()} className="apple-primary plasmo-text-sm">
                                    {hasKey ? "Save key" : "Connect"}
                                </button>
                                {editing && (
                                    <button type="button" onClick={() => setEditing(false)} className="apple-secondary plasmo-px-4 plasmo-text-sm">
                                        Cancel
                                    </button>
                                )}
                            </div>
                            <p className="apple-muted plasmo-text-xs">
                                Stored only in this browser and not encrypted.{" "}
                                <a href={selected.keyUrl} target="_blank" rel="noopener noreferrer" className="apple-label plasmo-inline-flex plasmo-items-center plasmo-gap-0.5 plasmo-font-medium plasmo-underline plasmo-underline-offset-2">
                                    Get a {selected.name} key <ArrowUpRight className="plasmo-h-3 plasmo-w-3" />
                                </a>
                            </p>
                        </form>
                    ) : (
                        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-3 max-sm:plasmo-flex-col max-sm:plasmo-items-start">
                            <div>
                                <p className="apple-label plasmo-text-sm plasmo-font-medium">API key</p>
                                <p className="apple-muted plasmo-mt-0.5 plasmo-font-mono plasmo-text-xs">•••• {keyValue.slice(-4)}</p>
                            </div>
                            <div className="plasmo-flex plasmo-gap-2">
                                <button type="button" onClick={() => setEditing(true)} className="apple-secondary plasmo-px-4 plasmo-text-sm">
                                    Replace
                                </button>
                                <button type="button" onClick={() => saveKey(selected.id, "")} className="provider-remove plasmo-px-4 plasmo-text-sm plasmo-font-semibold">
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: model, only once the provider is connected and in use */}
                    {isActive && !editing && (
                        <div className="plasmo-flex plasmo-flex-col plasmo-gap-2">
                            <label htmlFor="provider-model" className="apple-label plasmo-text-sm plasmo-font-medium">Model</label>
                            <div className="plasmo-relative">
                                <select
                                    id="provider-model"
                                    value={model}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                    disabled={loadingModels}
                                    aria-invalid={isModelMissing && !loadingModels}
                                    className="apple-field plasmo-h-11 plasmo-w-full plasmo-appearance-none plasmo-pl-3 plasmo-pr-10 plasmo-text-sm">
                                    {loadingModels ? (
                                        <option>Loading models…</option>
                                    ) : (
                                        <>
                                            {isModelMissing && <option value="">Select a model</option>}
                                            {currentModels.length === 0 && model && <option value={model}>{model}</option>}
                                            {currentModels.map((m: any) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}{m.pricing?.prompt === "0" ? " — Free" : ""}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                <span className="apple-muted plasmo-pointer-events-none plasmo-absolute plasmo-right-3 plasmo-top-1/2 plasmo--translate-y-1/2">
                                    {loadingModels ? <Loader2 className="plasmo-h-4 plasmo-w-4 plasmo-animate-spin" /> : <ChevronDown className="plasmo-h-4 plasmo-w-4" />}
                                </span>
                            </div>
                            {!loadingModels && currentModels.length === 0 && (
                                <p className="apple-muted plasmo-text-xs">Couldn't load the model list. Check that the key is valid.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
