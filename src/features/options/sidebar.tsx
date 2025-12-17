import iconSrc from "url:~assets/icon.png"
import { Settings, History, ExternalLink, BookOpen, Shield, LifeBuoy } from "lucide-react"

interface SidebarProps {
    activeTab: "settings" | "history"
    setActiveTab: (tab: "settings" | "history") => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    return (
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
    )
}
