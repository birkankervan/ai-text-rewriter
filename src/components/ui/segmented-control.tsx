import type { CSSProperties, ReactNode } from "react"

export interface SegmentOption<T extends string> {
    value: T
    label: ReactNode
    disabled?: boolean
    title?: string
}

interface SegmentedControlProps<T extends string> {
    value: T
    options: readonly SegmentOption<T>[]
    onChange: (value: T) => void
    className?: string
    ariaLabel: string
}

export function SegmentedControl<T extends string>({ value, options, onChange, className = "", ariaLabel }: SegmentedControlProps<T>) {
    const activeIndex = Math.max(0, options.findIndex(option => option.value === value))
    const style = {
        "--segment-count": options.length,
        "--segment-index": activeIndex
    } as CSSProperties

    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={`apple-segmented segmented-control ${className}`}
            style={style}
        >
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    disabled={option.disabled}
                    title={option.title}
                    onClick={() => onChange(option.value)}
                    className={`apple-segment ${value === option.value ? "apple-segment-active" : ""}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
