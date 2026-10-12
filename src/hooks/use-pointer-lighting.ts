import { useEffect, useRef, type MouseEvent } from "react"

const TARGET_SELECTOR = "button, textarea, select, input, .pointer-target, .apple-segmented, .apple-result, .apple-card, .apple-glass"

export function usePointerLighting(enabled: boolean) {
    const frame = useRef<number | null>(null)
    const position = useRef({ x: 0, y: 0, root: null as HTMLElement | null, target: null as HTMLElement | null })
    const previousTarget = useRef<HTMLElement | null>(null)

    const clear = () => {
        previousTarget.current?.style.removeProperty("--edge-glow")
        previousTarget.current = null
    }

    const onMouseMove = (event: MouseEvent<HTMLElement>) => {
        if (!enabled) return
        position.current = {
            x: event.clientX,
            y: event.clientY,
            root: event.currentTarget,
            target: (event.target as HTMLElement).closest(TARGET_SELECTOR) as HTMLElement | null
        }
        if (frame.current !== null) return

        frame.current = requestAnimationFrame(() => {
            frame.current = null
            const { x, y, root, target } = position.current
            if (!root) return

            const rootBounds = root.getBoundingClientRect()
            root.style.setProperty("--spot-x", `${x - rootBounds.left}px`)
            root.style.setProperty("--spot-y", `${y - rootBounds.top}px`)

            if (previousTarget.current !== target) {
                previousTarget.current?.style.removeProperty("--edge-glow")
                previousTarget.current = target
            }
            if (!target) return

            const bounds = target.getBoundingClientRect()
            target.style.setProperty("--edge-x", `${x - bounds.left}px`)
            target.style.setProperty("--edge-y", `${y - bounds.top}px`)
            target.style.setProperty("--edge-glow", "1")
        })
    }

    useEffect(() => {
        if (!enabled) clear()
    }, [enabled])

    useEffect(() => () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        clear()
    }, [])

    return { onMouseMove, onMouseLeave: clear }
}
