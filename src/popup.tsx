

import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { Key, Settings2 } from "lucide-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import RewriteView from "~features/rewrite-view"
import { PopupSettingsView } from "~features/popup-settings-view"
import { type SupportedLanguage } from "~lib/constants"
import "./style.css"

const storage = new Storage()
const queryClient = new QueryClient()

function PopupContent() {
  const [activeTab, setActiveTab] = useState<"rewrite" | "settings">("rewrite")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [defaultRewriteLang, setDefaultRewriteLang] = useState<SupportedLanguage>("Keep Original")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      const activeProvider = await storage.get("active_provider") || "openrouter"
      const key = await storage.get(`${activeProvider}_key`)
      const rewriteLang = await storage.get("default_lang_rewrite") as SupportedLanguage

      if (key) setApiKey(key)
      if (rewriteLang) setDefaultRewriteLang(rewriteLang)
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="plasmo-w-[360px] plasmo-min-h-[300px] plasmo-relative plasmo-overflow-hidden plasmo-bg-slate-900 plasmo-text-slate-100" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      {/* Liquid Background Blobs */}
      <div className="plasmo-absolute plasmo-top-[-20%] plasmo-left-[-20%] plasmo-w-[80%] plasmo-h-[80%] plasmo-bg-blue-600/30 plasmo-rounded-full plasmo-blur-[80px] plasmo-animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="plasmo-absolute plasmo-bottom-[-20%] plasmo-right-[-20%] plasmo-w-[80%] plasmo-h-[80%] plasmo-bg-purple-600/30 plasmo-rounded-full plasmo-blur-[80px] plasmo-animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />

      {/* Glass Container */}
      <div className="plasmo-relative plasmo-z-10 plasmo-h-full plasmo-flex plasmo-flex-col plasmo-bg-white/10 dark:plasmo-bg-black/20 plasmo-backdrop-blur-xl plasmo-border plasmo-border-white/10">

        {/* Header */}
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-3 plasmo-py-2.5 plasmo-border-b plasmo-border-white/10">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
            <div className="plasmo-w-2 plasmo-h-2 plasmo-rounded-full plasmo-bg-blue-500 plasmo-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <h1 className="plasmo-text-xs plasmo-font-bold plasmo-tracking-wide plasmo-text-white/90">
              AI REWRITER
            </h1>
          </div>
          <button
            onClick={openOptions}
            className="plasmo-p-1.5 plasmo-rounded-full hover:plasmo-bg-white/10 plasmo-transition-all plasmo-text-white/50 hover:plasmo-text-white hover:plasmo-scale-110 active:plasmo-scale-95"
            title="Open Full Settings">
            <Key className="plasmo-w-3.5 plasmo-h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="plasmo-px-3 plasmo-pt-2 plasmo-pb-1">
          <div className="plasmo-flex plasmo-p-0.5 plasmo-bg-black/20 plasmo-rounded-lg plasmo-backdrop-blur-md plasmo-border plasmo-border-white/5">
            <button
              onClick={() => setActiveTab("rewrite")}
              className={`plasmo-flex-1 plasmo-py-1.5 plasmo-text-[10px] plasmo-font-bold plasmo-rounded-md plasmo-transition-all ${activeTab === "rewrite"
                ? "plasmo-bg-white/10 plasmo-text-white plasmo-shadow-lg plasmo-shadow-black/20 plasmo-border plasmo-border-white/10"
                : "plasmo-text-white/40 hover:plasmo-text-white/70 hover:plasmo-bg-white/5"
                }`}>
              Rewrite
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`plasmo-flex-1 plasmo-py-1.5 plasmo-text-[10px] plasmo-font-bold plasmo-rounded-md plasmo-transition-all ${activeTab === "settings"
                ? "plasmo-bg-white/10 plasmo-text-white plasmo-shadow-lg plasmo-shadow-black/20 plasmo-border plasmo-border-white/10"
                : "plasmo-text-white/40 hover:plasmo-text-white/70 hover:plasmo-bg-white/5"
                }`}>
              Settings
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="plasmo-flex-1 plasmo-p-1 plasmo-overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-h-full plasmo-min-h-[200px]">
              <div className="plasmo-w-5 plasmo-h-5 plasmo-border-2 plasmo-border-blue-500 plasmo-border-t-transparent plasmo-rounded-full plasmo-animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "rewrite" && (
                <div className="plasmo-animate-in plasmo-fade-in plasmo-slide-in-from-bottom-2 plasmo-duration-300">
                  <RewriteView
                    initialText=""
                    apiKey={apiKey}
                    defaultTargetLang={defaultRewriteLang}
                    showPlaceholder={true}
                  />
                </div>
              )}
              {activeTab === "settings" && (
                <div className="plasmo-animate-in plasmo-fade-in plasmo-slide-in-from-bottom-2 plasmo-duration-300 plasmo-p-2">
                  <PopupSettingsView />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function IndexPopup() {
  return (
    <QueryClientProvider client={queryClient}>
      <PopupContent />
    </QueryClientProvider>
  )
}

export default IndexPopup

