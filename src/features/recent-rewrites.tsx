import { sendToBackground } from "@plasmohq/messaging"
import { ChevronDown, ChevronUp, Clock, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import type { HistoryItem } from "~services/history"

export function RecentRewrites({ refreshKey }: { refreshKey: number }) {
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState<HistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        let mounted = true
        setIsLoading(true)
        setError(false)

        sendToBackground({
            name: "get-recent-history",
            body: { type: "rewrite", limit: 10 }
        }).then(response => {
            if (!mounted) return
            if (response?.success) setItems(response.items)
            else setError(true)
        }).catch(() => {
            if (mounted) setError(true)
        }).finally(() => {
            if (mounted) setIsLoading(false)
        })

        return () => {
            mounted = false
        }
    }, [isOpen, refreshKey])

    const toggleOpen = () => {
        if (isOpen) setIsOpen(false)
        else {
            setItems([])
            setIsOpen(true)
        }
    }

    const openHistory = () => {
        window.open(chrome.runtime.getURL("options.html?tab=history&type=rewrite"), "_blank")
    }

    return (
        <div className="tvos-focus-row plasmo-mt-1 plasmo-overflow-hidden plasmo-rounded-2xl plasmo-border">
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={toggleOpen}
                className="apple-label plasmo-flex plasmo-w-full plasmo-items-center plasmo-justify-between plasmo-px-3 plasmo-py-2.5 plasmo-text-xs plasmo-font-semibold hover:plasmo-bg-black/5 dark:hover:plasmo-bg-white/5">
                <span className="plasmo-flex plasmo-items-center plasmo-gap-1.5">
                    <Clock className="plasmo-h-3 plasmo-w-3" /> Last rewrites
                </span>
                {isOpen ? <ChevronUp className="plasmo-h-3 plasmo-w-3" /> : <ChevronDown className="plasmo-h-3 plasmo-w-3" />}
            </button>

            {isOpen && (
                <div className="plasmo-border-t" style={{ borderColor: "var(--apple-separator)" }}>
                    <div className="plasmo-max-h-60 plasmo-overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <p className="apple-muted plasmo-p-3 plasmo-text-center plasmo-text-xs">Loading rewrites...</p>
                        ) : error ? (
                            <p className="plasmo-p-3 plasmo-text-center plasmo-text-xs plasmo-text-red-500">Could not load rewrites.</p>
                        ) : items.length === 0 ? (
                            <p className="apple-muted plasmo-p-3 plasmo-text-center plasmo-text-xs">No rewrites yet.</p>
                        ) : items.map(item => (
                            <div key={item.id} className="plasmo-border-b plasmo-px-3 plasmo-py-2.5 last:plasmo-border-b-0" style={{ borderColor: "var(--apple-separator)" }}>
                                <div className="apple-muted plasmo-mb-1 plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-2 plasmo-text-[11px]">
                                    <span>{item.rewriteOptions?.tone || "Rewrite"}</span>
                                    <time>{new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(item.timestamp)}</time>
                                </div>
                                <p className="apple-label plasmo-line-clamp-2 plasmo-text-xs plasmo-leading-relaxed" title={item.result}>{item.result}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={openHistory}
                        className="plasmo-flex plasmo-w-full plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-border-t plasmo-py-2.5 plasmo-text-xs plasmo-font-semibold plasmo-text-blue-500 hover:plasmo-bg-black/5 dark:hover:plasmo-bg-white/5" style={{ borderColor: "var(--apple-separator)" }}>
                        View all rewrites <ExternalLink className="plasmo-h-3 plasmo-w-3" />
                    </button>
                </div>
            )}
        </div>
    )
}
