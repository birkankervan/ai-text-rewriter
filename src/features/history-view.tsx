import { useEffect, useMemo, useState } from "react"
import { Check, Copy, Search, Trash2 } from "lucide-react"
import { historyService, type HistoryItem } from "~services/history"
import { SegmentedControl } from "~components/ui/segmented-control"

type Filter = "all" | "rewrite" | "translate"

// History is pruned after 15 days, so a simple page size is enough; no virtualization.
const PAGE_SIZE = 50
const LONG_TEXT = 220

const dayLabel = (timestamp: number) => {
    const day = new Date(timestamp).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0)
    if (day === today) return "Today"
    if (day === today - 86_400_000) return "Yesterday"
    return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(day)
}

const timeLabel = (timestamp: number) =>
    new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(timestamp)

function HistoryEntry({ item, onDelete }: { item: HistoryItem, onDelete: (id: number) => void }) {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(false)
    const isLong = item.result.length > LONG_TEXT || item.original.length > LONG_TEXT
    const detail = item.type === "translate"
        ? item.translateOptions?.targetLang && `to ${item.translateOptions.targetLang}`
        : item.rewriteOptions?.tone

    const copy = async () => {
        await navigator.clipboard.writeText(item.result)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <li className="settings-row plasmo-flex plasmo-flex-col plasmo-gap-2 plasmo-px-5 plasmo-py-4">
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-3">
                <p className="apple-muted plasmo-min-w-0 plasmo-truncate plasmo-text-xs">
                    <span className="apple-label plasmo-font-semibold">{item.type === "translate" ? "Translate" : "Rewrite"}</span>
                    {detail && <> · {detail}</>}
                    {" · "}{timeLabel(item.timestamp)}
                    <span className="max-sm:plasmo-hidden" title={item.model}> · {item.provider}</span>
                </p>
                <div className="plasmo-flex plasmo-shrink-0 plasmo-gap-1">
                    <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy result"} title="Copy result" className="history-action">
                        {copied ? <Check className="plasmo-h-4 plasmo-w-4" /> : <Copy className="plasmo-h-4 plasmo-w-4" />}
                    </button>
                    <button type="button" onClick={() => onDelete(item.id!)} aria-label="Delete entry" title="Delete entry" className="history-action history-action-danger">
                        <Trash2 className="plasmo-h-4 plasmo-w-4" />
                    </button>
                </div>
            </div>

            <p className={`apple-label plasmo-whitespace-pre-wrap plasmo-text-sm plasmo-leading-relaxed ${expanded ? "" : "plasmo-line-clamp-3"}`}>
                {item.result}
            </p>
            <p className={`apple-muted plasmo-whitespace-pre-wrap plasmo-border-l-2 plasmo-pl-3 plasmo-text-xs plasmo-leading-relaxed ${expanded ? "" : "plasmo-line-clamp-2"}`} style={{ borderColor: "var(--apple-separator)" }}>
                {item.original}
            </p>

            {isLong && (
                <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} className="apple-label plasmo-self-start plasmo-text-xs plasmo-font-medium plasmo-underline plasmo-underline-offset-2">
                    {expanded ? "Show less" : "Show full text"}
                </button>
            )}
        </li>
    )
}

export function HistoryView({ initialFilter = "all" }: { initialFilter?: Filter }) {
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<Filter>(initialFilter)
    const [query, setQuery] = useState("")
    const [limit, setLimit] = useState(PAGE_SIZE)
    const [confirmClear, setConfirmClear] = useState(false)

    useEffect(() => {
        historyService.getAll()
            .then(items => setHistory(items.reverse()))
            .catch(error => {
                console.error("Failed to load history:", error)
                setHistory([])
            })
            .finally(() => setIsLoading(false))
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return history.filter(item =>
            (filter === "all" || item.type === filter) &&
            (!q || item.original.toLowerCase().includes(q) || item.result.toLowerCase().includes(q))
        )
    }, [history, filter, query])

    const groups = useMemo(() => {
        const map = new Map<string, HistoryItem[]>()
        for (const item of filtered.slice(0, limit)) {
            const label = dayLabel(item.timestamp)
            map.set(label, [...(map.get(label) ?? []), item])
        }
        return [...map]
    }, [filtered, limit])

    const deleteEntry = async (id: number) => {
        await historyService.delete(id)
        setHistory(prev => prev.filter(item => item.id !== id))
    }

    const clearAll = async () => {
        await historyService.clear()
        setHistory([])
        setConfirmClear(false)
    }

    return (
        <section aria-labelledby="history-heading" className="plasmo-flex plasmo-flex-col plasmo-gap-6">
            <div className="plasmo-flex plasmo-items-end plasmo-justify-between plasmo-gap-4">
                <div>
                    <h2 id="history-heading" className="apple-label plasmo-text-xl plasmo-font-semibold plasmo-tracking-tight">History</h2>
                    <p className="apple-muted plasmo-mt-1 plasmo-text-sm" aria-live="polite">
                        {isLoading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"} · kept for 15 days`}
                    </p>
                </div>
                {history.length > 0 && (
                    confirmClear ? (
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                            <button type="button" onClick={() => setConfirmClear(false)} className="apple-secondary plasmo-px-4 plasmo-text-sm">Cancel</button>
                            <button type="button" onClick={clearAll} className="provider-remove plasmo-px-4 plasmo-text-sm plasmo-font-semibold">Delete all</button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setConfirmClear(true)} className="provider-remove plasmo-px-4 plasmo-text-sm plasmo-font-semibold">
                            Clear history
                        </button>
                    )
                )}
            </div>

            <div className="plasmo-flex plasmo-items-center plasmo-gap-3 max-sm:plasmo-flex-col max-sm:plasmo-items-stretch">
                <SegmentedControl<Filter>
                    ariaLabel="Filter history"
                    value={filter}
                    onChange={(next) => { setFilter(next); setLimit(PAGE_SIZE) }}
                    className="plasmo-w-72 max-sm:plasmo-w-full"
                    options={[
                        { value: "all", label: "All" },
                        { value: "rewrite", label: "Rewrite" },
                        { value: "translate", label: "Translate" }
                    ]}
                />
                <div className="plasmo-relative plasmo-flex-1">
                    <label htmlFor="history-search" className="plasmo-sr-only">Search history</label>
                    <Search className="apple-muted plasmo-pointer-events-none plasmo-absolute plasmo-left-3 plasmo-top-1/2 plasmo-h-4 plasmo-w-4 plasmo--translate-y-1/2" />
                    <input
                        id="history-search"
                        type="search"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setLimit(PAGE_SIZE) }}
                        placeholder="Search text"
                        className="apple-field plasmo-h-10 plasmo-w-full plasmo-pl-9 plasmo-pr-3 plasmo-text-sm"
                    />
                </div>
            </div>

            {!isLoading && filtered.length === 0 ? (
                <div className="apple-card plasmo-flex plasmo-flex-col plasmo-items-center plasmo-gap-1 plasmo-px-6 plasmo-py-14 plasmo-text-center">
                    <p className="apple-label plasmo-text-sm plasmo-font-semibold">
                        {history.length === 0 ? "No history yet" : "No matching entries"}
                    </p>
                    <p className="apple-muted plasmo-text-xs">
                        {history.length === 0 ? "Rewrites and translations you run will appear here." : "Try another word or filter."}
                    </p>
                </div>
            ) : (
                groups.map(([label, items]) => (
                    <div key={label} className="plasmo-flex plasmo-flex-col plasmo-gap-2">
                        <h3 className="apple-muted plasmo-px-1 plasmo-text-xs plasmo-font-semibold">{label}</h3>
                        <ul className="apple-card settings-group">
                            {items.map(item => <HistoryEntry key={item.id} item={item} onDelete={deleteEntry} />)}
                        </ul>
                    </div>
                ))
            )}

            {filtered.length > limit && (
                <button type="button" onClick={() => setLimit(l => l + PAGE_SIZE)} className="apple-secondary plasmo-self-center plasmo-px-5 plasmo-text-sm">
                    Show {Math.min(PAGE_SIZE, filtered.length - limit)} more
                </button>
            )}
        </section>
    )
}
