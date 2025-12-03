import { openDB, type DBSchema, type IDBPDatabase } from "idb"

interface HistoryItem {
    id?: number
    type: "translate" | "rewrite"
    original: string
    result: string
    timestamp: number
    provider: string
    model: string
    // Extra details for rewrite
    rewriteOptions?: {
        tone?: string
        fixGrammar?: boolean
    }
    // Extra details for translate
    translateOptions?: {
        targetLang?: string
    }
}

interface HistoryDB extends DBSchema {
    history: {
        key: number
        value: HistoryItem
        indexes: { "by-date": number }
    }
}

const DB_NAME = "ai-text-rewriter-db"
const STORE_NAME = "history"

class HistoryService {
    private dbPromise: Promise<IDBPDatabase<HistoryDB>>

    constructor() {
        this.dbPromise = openDB<HistoryDB>(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true
                })
                store.createIndex("by-date", "timestamp")
            }
        })
    }

    async add(item: Omit<HistoryItem, "id" | "timestamp">) {
        const db = await this.dbPromise
        return db.add(STORE_NAME, {
            ...item,
            timestamp: Date.now()
        })
    }

    async getAll() {
        const db = await this.dbPromise
        return db.getAllFromIndex(STORE_NAME, "by-date")
    }

    async clear() {
        const db = await this.dbPromise
        return db.clear(STORE_NAME)
    }

    async deleteOlderThan(maxAgeMs: number) {
        const db = await this.dbPromise
        const cutoff = Date.now() - maxAgeMs
        const range = IDBKeyRange.upperBound(cutoff)

        const tx = db.transaction(STORE_NAME, "readwrite")
        const index = tx.store.index("by-date")

        let cursor = await index.openCursor(range)
        let count = 0
        while (cursor) {
            await cursor.delete()
            count++
            cursor = await cursor.continue()
        }
        await tx.done
        return count
    }
}

export const historyService = new HistoryService()
export type { HistoryItem }
