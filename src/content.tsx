import cssText from "data-text:~style.css"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Storage } from "@plasmohq/storage"
import type { PlasmoCSConfig } from "plasmo"

import { TranslationModal } from "~features/translation-modal"
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

const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false
  const tagName = element.tagName.toLowerCase()
  const isInput = tagName === "input" || tagName === "textarea"
  const isContentEditable = (element as HTMLElement).isContentEditable

  if (isInput) {
    const input = element as HTMLInputElement | HTMLTextAreaElement
    return !input.readOnly && !input.disabled
  }

  return isContentEditable
}

const MODAL_WIDTH = 380
const PADDING = 12
const OFFSET_Y = 12

const getClampedPosition = (x: number, y: number, screenWidth: number) => {
  const minX = MODAL_WIDTH / 2 + PADDING
  const maxX = screenWidth - (MODAL_WIDTH / 2) - PADDING

  return {
    x: Math.max(minX, Math.min(x, maxX)),
    y
  }
}

interface FloatingButtonProps {
  mode: "rewrite" | "translate"
  position: { x: number; y: number }
  onRewrite: () => void
  onTranslate: () => void
  onMouseEnterTranslate?: () => void
}

const FloatingButton = memo(({ mode, position, onRewrite, onTranslate, onMouseEnterTranslate }: FloatingButtonProps) => {
  const isRewrite = mode === "rewrite"

  return (
    <div
      className="plasmo-fixed plasmo-z-50 plasmo-animate-in plasmo-fade-in plasmo-zoom-in plasmo-duration-300"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
        marginTop: `-${OFFSET_Y}px`
      }}
    >
      <button
        onClick={isRewrite ? onRewrite : onTranslate}
        onMouseEnter={!isRewrite ? onMouseEnterTranslate : undefined}
        className="plasmo-group plasmo-relative plasmo-flex plasmo-items-center plasmo-justify-center plasmo-w-10 plasmo-h-10 plasmo-bg-white/90 dark:plasmo-bg-slate-900/90 plasmo-backdrop-blur-xl plasmo-shadow-[0_0_20px_rgba(59,130,246,0.3)] plasmo-border plasmo-border-white/20 plasmo-rounded-full plasmo-transition-all plasmo-duration-300 hover:plasmo-scale-110 hover:plasmo-shadow-[0_0_30px_rgba(59,130,246,0.5)] active:plasmo-scale-95 focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/50"
        aria-label={isRewrite ? "Rewrite with AI" : "Translate with AI"}
        title={isRewrite ? "Rewrite" : "Translate"}
      >
        {/* Animated Gradient Background */}
        <div className="plasmo-absolute plasmo-inset-0 plasmo-rounded-full plasmo-bg-blue-500/10 plasmo-animate-pulse" />

        {/* Icon */}
        {isRewrite ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="plasmo-w-5 plasmo-h-5 plasmo-text-slate-700 dark:plasmo-text-slate-200 group-hover:plasmo-text-blue-500 plasmo-transition-colors">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M9 3v4" />
            <path d="M3 5h4" />
            <path d="M3 9h4" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="plasmo-w-5 plasmo-h-5 plasmo-text-slate-700 dark:plasmo-text-slate-200 group-hover:plasmo-text-green-500 plasmo-transition-colors">
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-10-5 10" />
            <path d="M14 18h6" />
          </svg>
        )}
      </button>
    </div>
  )
})
FloatingButton.displayName = "FloatingButton"

const queryClient = new QueryClient()

const PlasmoOverlayContent = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState<"rewrite" | "translate">("translate")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [selectedText, setSelectedText] = useState("")
  const [selectionRange, setSelectionRange] = useState<Range | null>(null)
  const [modalPlacement, setModalPlacement] = useState<"top" | "bottom">("bottom")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if API key exists for rewrite functionality
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    const checkApiKey = async () => {
      const storage = new Storage()
      const activeProvider = await storage.get("active_provider") || "openrouter"
      const apiKey = await storage.get(`${activeProvider}_key`)
      setHasApiKey(!!apiKey)
    }
    checkApiKey()

    // Re-check when window gains focus (in case user added key in options)
    const handleFocus = () => checkApiKey()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Use new useStream hook - no separate saveHistory function needed
  const { generate, data: prefetchedData, isLoading: isPrefetching } = useStream()
  const [hasPrefetched, setHasPrefetched] = useState(false)

  const handleMouseEnterTranslate = useCallback(async () => {
    if (mode === "translate" && selectedText && !hasPrefetched && !showModal) {
      const storage = new Storage()
      const defaultLang = await storage.get("default_lang_translate") as SupportedLanguage || "English"

      // Always prefetch - translation gateway will handle provider selection
      //  (free translation doesn't need API key)
      setHasPrefetched(true)
      // Enable autoSaveHistory for prefetch - it will save when complete
      generate(selectedText, { mode: "translate", targetLang: defaultLang }, true)
    }
  }, [mode, selectedText, hasPrefetched, showModal, generate])

  const handleSelection = useCallback(() => {
    if (showModal) return // Don't update selection while modal is open

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      const selection = window.getSelection()
      const activeElement = document.activeElement

      const hasSelection = selection && selection.toString().trim().length > 0

      let isInputSelection = false
      let currentSelectedText = ""

      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        const input = activeElement as HTMLInputElement | HTMLTextAreaElement
        if (input.selectionStart !== input.selectionEnd) {
          isInputSelection = true
          currentSelectedText = input.value.substring(input.selectionStart!, input.selectionEnd!)
          setTargetElement(input)
        }
      } else if (hasSelection) {
        currentSelectedText = selection!.toString()
        setTargetElement(null)
      }

      if (!hasSelection && !isInputSelection) {
        setIsVisible(false)
        setHasPrefetched(false) // Reset prefetch state
        return
      }

      // Only update if text changed to avoid resetting prefetch on minor selection adjustments
      if (currentSelectedText !== selectedText) {
        setSelectedText(currentSelectedText)
        setHasPrefetched(false)
      }

      const editable = isEditableElement(activeElement)

      setMode(editable ? "rewrite" : "translate")

      // If it's a contenteditable element, capture the range
      if (editable && !isInputSelection && selection && selection.rangeCount > 0) {
        setSelectionRange(selection.getRangeAt(0).cloneRange())
        setTargetElement(activeElement as HTMLElement)
      } else {
        setSelectionRange(null)
      }

      let rect: DOMRect | null = null

      if (editable && isInputSelection) {
        rect = activeElement!.getBoundingClientRect()
      } else if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        rect = range.getBoundingClientRect()
      }

      if (rect) {
        const x = rect.left + rect.width / 2
        const y = rect.top - OFFSET_Y

        setPosition({ x, y })

        // Calculate placement based on screen position
        const screenHeight = window.innerHeight
        if (y > screenHeight / 2) {
          setModalPlacement("top")
        } else {
          setModalPlacement("bottom")
        }

        setIsVisible(true)
      }
    }, 150)
  }, [showModal, selectedText])

  const handleReplace = useCallback((newText: string) => {
    if (targetElement) {
      if ((targetElement.tagName === "INPUT" || targetElement.tagName === "TEXTAREA") && 'value' in targetElement) {
        const input = targetElement as HTMLInputElement | HTMLTextAreaElement
        const start = input.selectionStart
        const end = input.selectionEnd
        const originalText = input.value

        // Replace only the selected part
        const updatedText = originalText.substring(0, start!) + newText + originalText.substring(end!)

        input.value = updatedText

        // Dispatch events to ensure frameworks pick up the change
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      } else if (targetElement.isContentEditable && selectionRange) {
        try {
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(selectionRange)

          // Attempt to use execCommand for better compatibility (undo stack, etc.)
          const success = document.execCommand("insertText", false, newText)

          if (!success) {
            // Fallback: Delete contents and insert text node
            selectionRange.deleteContents()
            selectionRange.insertNode(document.createTextNode(newText))

            // Dispatch input event for frameworks
            targetElement.dispatchEvent(new Event('input', { bubbles: true }))
          }
        } catch (e) {
          console.error("Failed to replace text in contenteditable:", e)
        }
      }

      setShowModal(false)
      setIsVisible(false)
      setHasPrefetched(false)
    }
  }, [targetElement, selectionRange])

  useEffect(() => {
    document.addEventListener("mouseup", handleSelection)
    document.addEventListener("keyup", handleSelection)

    return () => {
      document.removeEventListener("mouseup", handleSelection)
      document.removeEventListener("keyup", handleSelection)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [handleSelection])

  // Memoize modal position to prevent recalculation on every render
  const clampedPosition = useMemo(() =>
    getClampedPosition(position.x, position.y, window.innerWidth),
    [position.x, position.y]
  )

  const handleOpenModal = useCallback(() => setShowModal(true), [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setIsVisible(false)
    setHasPrefetched(false)
  }, [])

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
        // Pass prefetch data
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
