import { forwardRef, type TextareaHTMLAttributes } from "react"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    // Add any specific props if needed
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = "", ...props }, ref) => {
    return (
        <textarea
            ref={ref}
            className={`plasmo-w-full plasmo-bg-white/5 plasmo-text-white/90 plasmo-resize-none focus:plasmo-outline-none focus:plasmo-ring-1 focus:plasmo-ring-white/20 focus:plasmo-bg-white/10 plasmo-transition-all plasmo-text-xs plasmo-leading-relaxed plasmo-placeholder-white/20 ${className}`}
            {...props}
        />
    )
})

Textarea.displayName = "Textarea"
