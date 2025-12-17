import { useState, useMemo } from "react"
import { MODAL_WIDTH, PADDING, OFFSET_Y } from "./constants"

interface Position {
    x: number
    y: number
}

const getClampedPosition = (x: number, y: number, screenWidth: number) => {
    const minX = MODAL_WIDTH / 2 + PADDING
    const maxX = screenWidth - (MODAL_WIDTH / 2) - PADDING

    return {
        x: Math.max(minX, Math.min(x, maxX)),
        y
    }
}

export function useFloatingPosition() {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
    const [modalPlacement, setModalPlacement] = useState<"top" | "bottom">("bottom")

    const updatePosition = (rect: DOMRect) => {
        const x = rect.left + rect.width / 2
        const y = rect.top - OFFSET_Y

        setPosition({ x, y })

        const screenHeight = window.innerHeight
        if (y > screenHeight / 2) {
            setModalPlacement("top")
        } else {
            setModalPlacement("bottom")
        }
    }

    const clampedPosition = useMemo(() =>
        getClampedPosition(position.x, position.y, window.innerWidth),
        [position.x, position.y]
    )

    return {
        position,
        clampedPosition,
        modalPlacement,
        updatePosition
    }
}
