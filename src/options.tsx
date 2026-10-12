import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import iconSrc from "url:~assets/icon.png"
import { HistoryView } from "~features/history-view"
import { DefaultsSection } from "~features/options/defaults-section"
import { ProviderSetup } from "~features/options/provider-setup"
import { useOptionsSettings } from "~features/options/use-options-settings"
import { useAppearance } from "~hooks/use-appearance"
import { usePointerLighting } from "~hooks/use-pointer-lighting"
import { SegmentedControl } from "~components/ui/segmented-control"
import "./style.css"

const queryClient = new QueryClient()

const LINKS = [
    { href: "https://birkankervan.github.io/ai-text-rewriter/", label: "Website" },
    { href: "https://birkankervan.github.io/ai-text-rewriter/setup.html", label: "Setup guide" },
    { href: "https://birkankervan.github.io/ai-text-rewriter/PRIVACY_POLICY", label: "Privacy" },
    { href: "mailto:e.birkankervan@gmail.com", label: "Support" }
]

function OptionsContent() {
    const params = new URLSearchParams(window.location.search)
    const [activeTab, setActiveTab] = useState<"settings" | "history">(params.get("tab") === "history" ? "history" : "settings")
    const settings = useOptionsSettings()
    const hasAnyKey = Object.values(settings.keyExists).some(Boolean)
    const appearance = useAppearance()
    const pointerLighting = usePointerLighting(appearance.pointerLighting)

    return (
        <div className={`apple-theme tvos-shell options-page pointer-surface ${appearance.className} ${appearance.pointerLighting ? "pointer-light-active" : ""}`} {...pointerLighting}>
            <header className="tvos-header plasmo-sticky plasmo-top-0 plasmo-z-20 plasmo-border-b" style={{ borderColor: "var(--apple-separator)" }}>
                <div className="plasmo-mx-auto plasmo-flex plasmo-h-16 plasmo-max-w-3xl plasmo-items-center plasmo-justify-between plasmo-gap-4 plasmo-px-6">
                    <div className="plasmo-flex plasmo-min-w-0 plasmo-items-center plasmo-gap-2.5">
                        <img src={iconSrc} alt="" aria-hidden="true" className="plasmo-h-7 plasmo-w-7 plasmo-rounded-lg" />
                        <span className="apple-label plasmo-truncate plasmo-text-base plasmo-font-semibold plasmo-tracking-tight max-sm:plasmo-hidden">Smart Translate & Rewrite</span>
                    </div>
                    <SegmentedControl<"settings" | "history">
                        ariaLabel="Section"
                        value={activeTab}
                        onChange={setActiveTab}
                        className="plasmo-w-56"
                        options={[
                            { value: "settings", label: "Settings" },
                            { value: "history", label: "History" }
                        ]}
                    />
                </div>
            </header>

            <main className="plasmo-mx-auto plasmo-max-w-3xl plasmo-px-6 plasmo-pb-16 plasmo-pt-10">
                {activeTab === "settings" ? (
                    <div className="plasmo-flex plasmo-flex-col plasmo-gap-12">
                        <ProviderSetup {...settings} />
                        <DefaultsSection hasAnyKey={hasAnyKey} />
                    </div>
                ) : (
                    <HistoryView initialFilter={params.get("type") === "rewrite" ? "rewrite" : "all"} />
                )}

                <footer className="plasmo-mt-16 plasmo-flex plasmo-flex-wrap plasmo-gap-x-6 plasmo-gap-y-2 plasmo-border-t plasmo-pt-6" style={{ borderColor: "var(--apple-separator)" }}>
                    {LINKS.map(link => (
                        <a
                            key={link.label}
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="apple-muted plasmo-text-xs plasmo-font-medium hover:plasmo-underline">
                            {link.label}
                        </a>
                    ))}
                </footer>
            </main>
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
