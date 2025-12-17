import cssText from "data-text:~style.css"
import { useCallback, useEffect, useState, useRef } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Storage } from "@plasmohq/storage"
import type { PlasmoCSConfig } from "plasmo"

import { TranslationModal } from "~features/translation-modal"
import { FloatingButton } from "~features/content/floating-button"
import { useSelectionManager } from "~features/content/use-selection-manager"

import { useStream } from "~hooks/use-stream"
import type { SupportedLanguage } from "~lib/constants"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16
  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize
    return `${pixelsValue}px`
  })
  const styleElement = document.createElement("style")
  styleElement.textContent = updatedCssText
  return styleElement
}

const queryClient = new QueryClient()

const PlasmoOverlayContent = () => {
  const [showModal, setShowModal] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  // Integrate selection manager hook
  const {
    isVisible,
    setIsVisible, // Need this to close button when modal opens
    mode,
    targetElement,
    selectedText,
    selectionRange,
    clampedPosition,
    position,
    modalPlacement
  } = useSelectionManager({
    showModal,
    onSelectionChange: () => setHasPrefetched(false)
  })

  // Prefetching logic integration
  const { generate, data: prefetchedData, isLoading: isPrefetching } = useStream()
  const [hasPrefetched, setHasPrefetched] = useState(false)

  // Check API key existence
  useEffect(() => {
    const checkApiKey = async () => {
      const storage = new Storage()
      const activeProvider = await storage.get("active_provider") || "openrouter"
      const apiKey = await storage.get(`${activeProvider}_key`)
      setHasApiKey(!!apiKey)
    }
    checkApiKey()

    const handleFocus = () => checkApiKey()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleMouseEnterTranslate = useCallback(async () => {
    if (mode === "translate" && selectedText && !hasPrefetched && !showModal) {
      const storage = new Storage()
      const defaultLang = await storage.get("default_lang_translate") as SupportedLanguage || "English"

      setHasPrefetched(true)
      generate(selectedText, { mode: "translate", targetLang: defaultLang }, true)
    }
  }, [mode, selectedText, hasPrefetched, showModal, generate])


  const handleReplace = useCallback((newText: string) => {
    if (targetElement) {
      if ((targetElement.tagName === "INPUT" || targetElement.tagName === "TEXTAREA") && 'value' in targetElement) {
        const input = targetElement as HTMLInputElement | HTMLTextAreaElement
        const start = input.selectionStart
        const end = input.selectionEnd
        const originalText = input.value

        const updatedText = originalText.substring(0, start!) + newText + originalText.substring(end!)
        input.value = updatedText

        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      } else if (targetElement.isContentEditable && selectionRange) {
        try {
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(selectionRange)

          const success = document.execCommand("insertText", false, newText)

          if (!success) {
            selectionRange.deleteContents()
            selectionRange.insertNode(document.createTextNode(newText))
            targetElement.dispatchEvent(new Event('input', { bubbles: true }))
          }
        } catch (e) {
          console.error("Failed to replace text in contenteditable:", e)
        }
      }

      setShowModal(false)
      setIsVisible(false) // Close the floating button too
      setHasPrefetched(false)
    }
  }, [targetElement, selectionRange, setIsVisible])

  const handleOpenModal = useCallback(() => setShowModal(true), [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setIsVisible(false)
    setHasPrefetched(false)
  }, [setIsVisible])

  if (!isVisible) return null

  if (showModal) {
    return (
      <TranslationModal
        isOpen={showModal}
        onClose={handleCloseModal}
        initialText={selectedText}
        position={clampedPosition}
        placement={modalPlacement}
        initialMode={mode}
        onReplace={targetElement ? handleReplace : undefined}
        prefetchedData={mode === "translate" ? prefetchedData : undefined}
        prefetchedIsLoading={mode === "translate" ? isPrefetching : undefined}
      />
    )
  }

  return (
    <FloatingButton
      mode={mode}
      position={position}
      onRewrite={handleOpenModal}
      onTranslate={handleOpenModal}
      onMouseEnterTranslate={handleMouseEnterTranslate}
    />
  )
}

const PlasmoOverlay = () => (
  <QueryClientProvider client={queryClient}>
    <PlasmoOverlayContent />
  </QueryClientProvider>
)

export default PlasmoOverlay
