import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HistoryTable } from "~features/history-table"
import { Sidebar } from "~features/options/sidebar"
import { DefaultsSection } from "~features/options/defaults-section"
import { ActiveProviderSection } from "~features/options/active-provider-section"
import { KeyVaultSection } from "~features/options/key-vault-section"
import { useOptionsSettings } from "~features/options/use-options-settings"
import "./style.css"

const queryClient = new QueryClient()

function OptionsContent() {
    const [activeTab, setActiveTab] = useState<"settings" | "history">("settings")

    // Custom Hook managing all settings state
    const {
        activeProvider,
        keys,
        keyExists,
        model,
        savedStatus,
        handleActiveProviderChange,
        handleKeyChange,
        saveKey,
        handleModelChange,
        currentModels,
        loadingModels,
        isModelMissing
    } = useOptionsSettings()

    const hasAnyKey = Object.values(keyExists).some(Boolean)
    const activeKey = keys[activeProvider] || ""

    return (
        <div className="plasmo-min-h-screen plasmo-bg-gray-50 dark:plasmo-bg-slate-950 plasmo-text-slate-900 dark:plasmo-text-slate-100 plasmo-flex" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
            {/* Sidebar Navigation */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Area */}
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
                            {/* Section A: Defaults & Preferences */}
                            <DefaultsSection hasAnyKey={hasAnyKey} />

                            {/* Section B: General Settings (Active Provider) */}
                            <ActiveProviderSection
                                activeProvider={activeProvider}
                                keyExists={keyExists}
                                model={model}
                                handleActiveProviderChange={handleActiveProviderChange}
                                handleModelChange={handleModelChange}
                                activeKey={activeKey}
                                currentModels={currentModels}
                                loadingModels={loadingModels}
                                isModelMissing={isModelMissing}
                            />

                            {/* Section C: API Key Vault */}
                            <KeyVaultSection
                                keys={keys}
                                keyExists={keyExists}
                                savedStatus={savedStatus}
                                handleKeyChange={handleKeyChange}
                                saveKey={saveKey}
                            />
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
