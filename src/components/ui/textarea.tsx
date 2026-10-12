import { forwardRef, type TextareaHTMLAttributes } from "react"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    // Add any specific props if needed
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = "", ...props }, ref) => {
    return (
        <textarea
            ref={ref}
            className={`apple-field plasmo-w-full plasmo-resize-none plasmo-transition-all plasmo-text-[13px] plasmo-leading-relaxed ${className}`}
            {...props}
        />
    )
})

Textarea.displayName = "Textarea"
