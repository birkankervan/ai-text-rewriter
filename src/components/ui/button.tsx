import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    isLoading?: boolean
    variant?: "primary" | "secondary" | "danger" | "ghost"
}

export const Button = ({
    children,
    className = "",
    isLoading = false,
    variant = "primary",
    disabled,
    ...props
}: ButtonProps) => {
    const baseStyles = "plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-text-xs plasmo-px-4 plasmo-py-2 focus-visible:plasmo-outline-none"

    const variants = {
        primary: "apple-primary disabled:plasmo-opacity-45 disabled:plasmo-cursor-not-allowed",
        secondary: "apple-secondary",
        danger: "apple-secondary plasmo-text-red-500",
        ghost: "plasmo-bg-transparent apple-label hover:plasmo-bg-black/5 dark:hover:plasmo-bg-white/5"
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <Loader2 className="plasmo-w-3 plasmo-h-3 plasmo-animate-spin" /> : children}
        </button>
    )
}
