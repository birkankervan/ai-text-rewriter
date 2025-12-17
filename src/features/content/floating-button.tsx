import { memo } from "react"
import { OFFSET_Y } from "./constants"

interface FloatingButtonProps {
    mode: "rewrite" | "translate"
    position: { x: number; y: number }
    onRewrite: () => void
    onTranslate: () => void
    onMouseEnterTranslate?: () => void
}

export const FloatingButton = memo(({ mode, position, onRewrite, onTranslate, onMouseEnterTranslate }: FloatingButtonProps) => {
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
