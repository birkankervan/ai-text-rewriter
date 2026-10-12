import { useState, useMemo, useCallback } from "react"
import { MODAL_WIDTH, PADDING, OFFSET_Y } from "./constants"

interface Position {
    x: number
    y: number
}

const MIN_MODAL_SPACE = 80

const getClampedPosition = (x: number, y: number, screenWidth: number, screenHeight: number) => {
    const halfWidth = Math.min(MODAL_WIDTH, screenWidth - PADDING * 2) / 2
    const minX = halfWidth + PADDING
    const maxX = Math.max(minX, screenWidth - halfWidth - PADDING)

    return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(MIN_MODAL_SPACE, Math.min(y, screenHeight - MIN_MODAL_SPACE))
    }
}

export function useFloatingPosition() {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
    const [modalY, setModalY] = useState(0)
    const [modalPlacement, setModalPlacement] = useState<"top" | "bottom">("bottom")

    const updatePosition = useCallback((rect: DOMRect) => {
        const x = rect.left + rect.width / 2
        const y = rect.top - OFFSET_Y

        setPosition({ x, y })

        // Anchor the modal above the selection's top or below its bottom so it never covers the text
        const placeTop = y > window.innerHeight / 2
        setModalPlacement(placeTop ? "top" : "bottom")
        setModalY(placeTop ? y : rect.bottom + OFFSET_Y)
    }, [])

    const clampedPosition = useMemo(() =>
        getClampedPosition(position.x, modalY, window.innerWidth, window.innerHeight),
        [position.x, modalY]
    )

    return {
        position,
        clampedPosition,
        modalPlacement,
        updatePosition
    }
}
