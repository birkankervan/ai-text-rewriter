import { useEffect, useState, useRef } from "react"
import { VariableSizeList as List } from "react-window"
import { historyService, type HistoryItem } from "~services/history"
import { Trash2, Search, ChevronDown, ChevronUp } from "lucide-react"

export function HistoryTable() {
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<"all" | "rewrite" | "translate">("all")
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
    const listRef = useRef<List>(null)

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        setIsLoading(true)
        try {
            const items = await historyService.getAll()
            setHistory(items.reverse())
        } catch (error) {
            console.error("Failed to load history:", error)
            setHistory([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleClear = async () => {
        if (confirm("Are you sure you want to clear all history?")) {
            await historyService.clear()
            setHistory([])
            setExpandedIds(new Set())
        }
    }

    const toggleExpand = (index: number) => {
        const newExpandedIds = new Set(expandedIds)
        if (newExpandedIds.has(index)) {
            newExpandedIds.delete(index)
        } else {
            newExpandedIds.add(index)
        }
        setExpandedIds(newExpandedIds)
        if (listRef.current) {
            listRef.current.resetAfterIndex(index)
        }
    }

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.original.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.result.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesTab = activeTab === "all" || item.type === activeTab

        return matchesSearch && matchesTab
    })

    const getItemSize = (index: number) => {
        return expandedIds.has(index) ? 300 : 100
    }

    const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
        const item = filteredHistory[index]
        const isExpanded = expandedIds.has(index)
        const date = new Intl.DateTimeFormat('default', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(new Date(item.timestamp))

        const ExpandableText = ({ label, text }: { label: string, text: string }) => (
            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1 plasmo-min-w-0">
                <span className="plasmo-text-[10px] plasmo-font-semibold plasmo-text-slate-400">{label}</span>
                <div className={`plasmo-text-slate-700 dark:plasmo-text-slate-300 plasmo-text-xs plasmo-leading-relaxed ${isExpanded ? "plasmo-whitespace-pre-wrap" : "plasmo-truncate"}`} title={!isExpanded ? text : undefined}>
                    {text}
                </div>
            </div>
        )

        return (
            <div style={style} className="plasmo-flex plasmo-flex-col plasmo-border-b plasmo-border-slate-100 dark:plasmo-border-slate-700/50 hover:plasmo-bg-slate-50 dark:hover:plasmo-bg-slate-800/50 plasmo-transition-colors">
                <div className="plasmo-flex plasmo-items-start plasmo-h-full">
                    {/* Type & Date */}
                    <div className="plasmo-w-32 plasmo-p-3 plasmo-flex plasmo-flex-col plasmo-gap-1 plasmo-shrink-0">
                        <span className={`plasmo-inline-flex plasmo-items-center plasmo-px-2 plasmo-py-0.5 plasmo-rounded-full plasmo-text-[10px] plasmo-font-medium plasmo-w-fit ${item.type === 'translate'
                            ? 'plasmo-bg-blue-100 plasmo-text-blue-700 dark:plasmo-bg-blue-900/30 dark:plasmo-text-blue-300'
                            : 'plasmo-bg-purple-100 plasmo-text-purple-700 dark:plasmo-bg-purple-900/30 dark:plasmo-text-purple-300'
                            }`}>
                            {item.type === 'translate' ? 'Translate' : 'Rewrite'}
                        </span>
                        <span className="plasmo-text-slate-400 dark:plasmo-text-slate-500 plasmo-text-[10px]">{date}</span>
                    </div>

                    {/* Content */}
                    <div className="plasmo-flex-1 plasmo-p-3 plasmo-grid plasmo-grid-cols-2 plasmo-gap-4 plasmo-min-w-0">
                        <ExpandableText label="Original" text={item.original} />
                        <ExpandableText label="Result" text={item.result} />
                    </div>

                    {/* Details & Toggle */}
                    <div className="plasmo-w-48 plasmo-p-3 plasmo-border-l plasmo-border-slate-100 dark:plasmo-border-slate-700/50 plasmo-shrink-0 plasmo-flex plasmo-flex-col plasmo-gap-2 plasmo-h-full">
                        <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                            <div className="plasmo-flex plasmo-items-center plasmo-gap-1">
                                <span className="plasmo-text-slate-500 dark:plasmo-text-slate-400">{item.provider}</span>
                                <span className="plasmo-text-slate-300">/</span>
                                <span className="plasmo-text-slate-500 dark:plasmo-text-slate-400 plasmo-truncate" title={item.model}>{item.model}</span>
                            </div>
                            <div className="plasmo-flex plasmo-flex-wrap plasmo-gap-1">
                                {item.type === 'translate' && item.translateOptions?.targetLang && (
                                    <span className="plasmo-px-1.5 plasmo-py-0.5 plasmo-rounded plasmo-bg-slate-100 dark:plasmo-bg-slate-800 plasmo-text-slate-600 dark:plasmo-text-slate-400 plasmo-text-[10px]">
                                        → {item.translateOptions.targetLang}
                                    </span>
                                )}
                                {item.type === 'rewrite' && item.rewriteOptions?.tone && (
                                    <span className="plasmo-px-1.5 plasmo-py-0.5 plasmo-rounded plasmo-bg-slate-100 dark:plasmo-bg-slate-800 plasmo-text-slate-600 dark:plasmo-text-slate-400 plasmo-text-[10px]">
                                        {item.rewriteOptions.tone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => toggleExpand(index)}
                            className="plasmo-mt-auto plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-text-[10px] plasmo-font-medium plasmo-text-blue-600 dark:plasmo-text-blue-400 hover:plasmo-underline plasmo-self-start"
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUp className="plasmo-w-3 plasmo-h-3" />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="plasmo-w-3 plasmo-h-3" />
                                    Show More
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-h-full plasmo-bg-white dark:plasmo-bg-slate-900 plasmo-rounded-xl plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-overflow-hidden">
            {/* Header */}
            <div className="plasmo-p-4 plasmo-border-b plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-flex plasmo-items-center plasmo-justify-between plasmo-bg-slate-50/50 dark:plasmo-bg-slate-800/50">
                <div className="plasmo-flex plasmo-items-center plasmo-gap-4">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                        <h2 className="plasmo-font-semibold plasmo-text-slate-800 dark:plasmo-text-slate-200">History</h2>
                        <span className="plasmo-px-2 plasmo-py-0.5 plasmo-rounded-full plasmo-bg-slate-200 dark:plasmo-bg-slate-700 plasmo-text-slate-600 dark:plasmo-text-slate-300 plasmo-text-xs plasmo-font-medium">
                            {history.length}
                        </span>
                    </div>

                    {/* Tabs */}
                    <div className="plasmo-flex plasmo-bg-slate-200 dark:plasmo-bg-slate-700 plasmo-rounded-lg plasmo-p-1 plasmo-gap-1">
                        {(["all", "rewrite", "translate"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`plasmo-px-3 plasmo-py-1 plasmo-rounded-md plasmo-text-xs plasmo-font-medium plasmo-capitalize plasmo-transition-all ${activeTab === tab
                                    ? "plasmo-bg-white dark:plasmo-bg-slate-800 plasmo-text-slate-900 dark:plasmo-text-white plasmo-shadow-sm"
                                    : "plasmo-text-slate-500 dark:plasmo-text-slate-400 hover:plasmo-text-slate-700 dark:hover:plasmo-text-slate-200"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                    <div className="plasmo-relative">
                        <Search className="plasmo-w-4 plasmo-h-4 plasmo-absolute plasmo-left-3 plasmo-top-1/2 plasmo-transform plasmo--translate-y-1/2 plasmo-text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="plasmo-pl-9 plasmo-pr-4 plasmo-py-1.5 plasmo-text-sm plasmo-rounded-lg plasmo-border plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-white dark:plasmo-bg-slate-800 focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500/20"
                        />
                    </div>
                    <button
                        onClick={handleClear}
                        className="plasmo-p-2 plasmo-text-slate-400 hover:plasmo-text-red-500 hover:plasmo-bg-red-50 dark:hover:plasmo-bg-red-900/20 plasmo-rounded-lg plasmo-transition-colors"
                        title="Clear History"
                    >
                        <Trash2 className="plasmo-w-4 plasmo-h-4" />
                    </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="plasmo-flex plasmo-items-center plasmo-border-b plasmo-border-slate-200 dark:plasmo-border-slate-700 plasmo-bg-slate-50 dark:plasmo-bg-slate-800/80 plasmo-text-xs plasmo-font-semibold plasmo-text-slate-500 dark:plasmo-text-slate-400">
                <div className="plasmo-w-32 plasmo-p-3">Type / Date</div>
                <div className="plasmo-flex-1 plasmo-p-3">Content</div>
                <div className="plasmo-w-48 plasmo-p-3">Details</div>
            </div>

            {/* List */}
            <div className="plasmo-flex-1">
                {isLoading ? (
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-h-full plasmo-text-slate-400 plasmo-text-sm">
                        Loading history...
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-h-full plasmo-text-slate-400 plasmo-gap-2">
                        <Search className="plasmo-w-8 plasmo-h-8 plasmo-opacity-20" />
                        <p className="plasmo-text-sm">No history found</p>
                    </div>
                ) : (
                    <List
                        ref={listRef}
                        height={500} // This should be dynamic or fill parent
                        itemCount={filteredHistory.length}
                        itemSize={getItemSize}
                        width="100%"
                        className="plasmo-scrollbar-thin"
                    >
                        {Row}
                    </List>
                )}
            </div>
        </div>
    )
}
