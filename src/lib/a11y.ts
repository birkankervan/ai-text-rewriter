import type { KeyboardEvent } from "react"

// Enter/Space activation for div role="button" elements
export const onActivate = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        fn()
    }
}
