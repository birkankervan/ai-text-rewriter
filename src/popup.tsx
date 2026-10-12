

import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { Settings } from "lucide-react"
import iconSrc from "url:~assets/icon.png"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import RewriteView from "~features/rewrite-view"
import { TranslatePopupView } from "~features/translate-popup-view"
import { type SupportedLanguage } from "~lib/constants"
import { useAppearance } from "~hooks/use-appearance"
import { SegmentedControl } from "~components/ui/segmented-control"
import { usePointerLighting } from "~hooks/use-pointer-lighting"
import "./style.css"

const storage = new Storage()
const queryClient = new QueryClient()

function PopupContent() {
  const [activeTab, setActiveTab] = useState<"rewrite" | "translate">("rewrite")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [defaultRewriteLang, setDefaultRewriteLang] = useState<SupportedLanguage>("Keep Original")
  const [defaultTranslateLang, setDefaultTranslateLang] = useState<SupportedLanguage>("English")
  const [isLoading, setIsLoading] = useState(true)
  const [tabDirection, setTabDirection] = useState<"left" | "right">("right")
  const appearance = useAppearance()
  const pointerLighting = usePointerLighting(appearance.pointerLighting)

  const changeTab = (next: "rewrite" | "translate") => {
    if (next === activeTab) return
    setTabDirection(next === "translate" ? "right" : "left")
    setActiveTab(next)
  }

  useEffect(() => {
    const loadSettings = async () => {
      const activeProvider = await storage.get("active_provider") || "openrouter"
      const key = await storage.get(`${activeProvider}_key`)
      const rewriteLang = await storage.get("default_lang_rewrite") as SupportedLanguage
      const translateLang = await storage.get("default_lang_translate") as SupportedLanguage

      if (key) setApiKey(key)
      if (rewriteLang) setDefaultRewriteLang(rewriteLang)
      if (translateLang) setDefaultTranslateLang(translateLang)
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  return (
    <div className={`apple-theme tvos-shell pointer-surface ${appearance.className} ${appearance.pointerLighting ? "pointer-light-active" : ""} plasmo-w-[400px] plasmo-min-h-[300px]`} {...pointerLighting}>
      <div className="plasmo-flex plasmo-min-h-[280px] plasmo-flex-col">
        <header className="tvos-header plasmo-flex plasmo-h-16 plasmo-items-center plasmo-justify-between plasmo-border-b plasmo-px-5" style={{ borderColor: "var(--apple-separator)" }}>
          <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
            <img src={iconSrc} alt="" className="plasmo-h-7 plasmo-w-7 plasmo-rounded-lg" aria-hidden="true" />
            <span className="apple-label plasmo-text-base plasmo-font-semibold plasmo-tracking-tight">Smart Translate & Rewrite</span>
          </div>
          <button onClick={() => chrome.runtime.openOptionsPage()} className="apple-icon-button plasmo-flex plasmo-items-center plasmo-justify-center" title="Open settings" aria-label="Open settings">
            <Settings className="plasmo-h-4 plasmo-w-4" />
          </button>
        </header>

        <nav aria-label="Mode" className="plasmo-px-5 plasmo-pt-4">
          <SegmentedControl
            ariaLabel="Mode"
            value={activeTab}
            onChange={changeTab}
            options={[
              { value: "rewrite", label: "Rewrite" },
              { value: "translate", label: "Translate" }
            ]}
          />
        </nav>

        <main className="plasmo-flex-1 plasmo-overflow-y-auto plasmo-p-5 custom-scrollbar">
          {isLoading ? (
            <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-h-full plasmo-min-h-[200px]">
              <div className="plasmo-w-5 plasmo-h-5 plasmo-border-2 plasmo-border-blue-500 plasmo-border-t-transparent plasmo-rounded-full plasmo-animate-spin" aria-label="Loading" />
            </div>
          ) : (
            <>
              {activeTab === "rewrite" && (
                <div key="rewrite" className={`tab-panel tab-panel-${tabDirection}`}>
                  <RewriteView
                    initialText=""
                    apiKey={apiKey}
                    defaultTargetLang={defaultRewriteLang}
                    showPlaceholder={false}
                    embedded
                    onOpenSettings={() => chrome.runtime.openOptionsPage()}
                  />
                </div>
              )}
              {activeTab === "translate" && (
                <div key="translate" className={`tab-panel tab-panel-${tabDirection}`}>
                  <TranslatePopupView
                    apiKey={apiKey}
                    defaultTargetLang={defaultTranslateLang}
                    embedded
                  />
                </div>
              )}
            </>
          )}
        </main>
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
