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
    const baseStyles = "plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-font-bold plasmo-text-xs plasmo-transition-all plasmo-py-2"

    const variants = {
        primary: "plasmo-bg-blue-600 hover:plasmo-bg-blue-500 plasmo-text-white plasmo-shadow-lg plasmo-shadow-blue-500/20 hover:plasmo-scale-[1.01] active:plasmo-scale-[0.98] disabled:plasmo-bg-gray-600/50 disabled:plasmo-text-white/50 disabled:plasmo-cursor-not-allowed disabled:plasmo-shadow-none",
        secondary: "plasmo-bg-white/5 hover:plasmo-bg-white/10 plasmo-text-white/70",
        danger: "plasmo-bg-red-500/10 hover:plasmo-bg-red-500/20 plasmo-text-red-400 plasmo-border plasmo-border-red-500/20",
        ghost: "plasmo-bg-transparent hover:plasmo-bg-white/5 plasmo-text-white/70"
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
