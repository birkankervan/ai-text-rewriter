import { useState, useEffect, useRef, useCallback } from "react"
import { isEditableElement, OFFSET_Y } from "./constants"
import { useFloatingPosition } from "./use-floating-position"

interface UseSelectionManagerProps {
    showModal: boolean
    onSelectionChange?: () => void
}

export function useSelectionManager({ showModal, onSelectionChange }: UseSelectionManagerProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [mode, setMode] = useState<"rewrite" | "translate">("translate")
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
    const [selectedText, setSelectedText] = useState("")
    const [selectionRange, setSelectionRange] = useState<Range | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const { position, clampedPosition, modalPlacement, updatePosition } = useFloatingPosition()

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
                onSelectionChange?.()
                return
            }

            if (currentSelectedText !== selectedText) {
                setSelectedText(currentSelectedText)
                onSelectionChange?.()
            }

            const editable = isEditableElement(activeElement)
            setMode(editable ? "rewrite" : "translate")

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
                updatePosition(rect)
                setIsVisible(true)
            }
        }, 150)
    }, [showModal, selectedText, onSelectionChange, updatePosition])

    useEffect(() => {
        document.addEventListener("mouseup", handleSelection)
        document.addEventListener("keyup", handleSelection)

        return () => {
            document.removeEventListener("mouseup", handleSelection)
            document.removeEventListener("keyup", handleSelection)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [handleSelection])

    return {
        isVisible,
        setIsVisible,
        mode,
        targetElement,
        selectedText,
        selectionRange,
        position,
        clampedPosition,
        modalPlacement
    }
}
