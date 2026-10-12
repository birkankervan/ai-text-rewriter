import { memo } from "react"
import { OFFSET_Y } from "./constants"
import { useAppearance } from "~hooks/use-appearance"
import { usePointerLighting } from "~hooks/use-pointer-lighting"

interface FloatingButtonProps {
    mode: "rewrite" | "translate"
    position: { x: number; y: number }
    onRewrite: () => void
    onTranslate: () => void
}

export const FloatingButton = memo(({ mode, position, onRewrite, onTranslate }: FloatingButtonProps) => {
    const isRewrite = mode === "rewrite"
    const appearance = useAppearance()
    const pointerLighting = usePointerLighting(appearance.pointerLighting)

    return (
        <div
            className={`pointer-surface ${appearance.className} ${appearance.pointerLighting ? "pointer-light-active" : ""} plasmo-fixed plasmo-z-50`}
            style={{
                left: position.x,
                top: position.y,
                transform: "translate(-50%, -100%)",
                marginTop: `-${OFFSET_Y}px`
            }}
            {...pointerLighting}
        >
            <button
                onClick={isRewrite ? onRewrite : onTranslate}
                className={`apple-theme apple-glass apple-icon-button ${appearance.className} plasmo-group plasmo-relative plasmo-flex plasmo-items-center plasmo-justify-center plasmo-w-11 plasmo-h-11 plasmo-rounded-full focus:plasmo-outline-none`}
                aria-label={isRewrite ? "Rewrite with AI" : "Translate with AI"}
                title={isRewrite ? "Rewrite" : "Translate"}
            >
                {/* Icon */}
                {isRewrite ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="apple-label plasmo-w-5 plasmo-h-5 plasmo-transition-colors">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        <path d="M5 3v4" />
                        <path d="M9 3v4" />
                        <path d="M3 5h4" />
                        <path d="M3 9h4" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="apple-label plasmo-w-5 plasmo-h-5 plasmo-transition-colors">
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
