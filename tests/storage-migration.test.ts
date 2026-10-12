import assert from "node:assert/strict"
import { test } from "node:test"
import { migrateSyncToLocal } from "~lib/storage"

// Minimal chrome.storage area: callback get (as storage.ts uses it), promise set/remove
function area(data: Record<string, unknown>) {
    return {
        data,
        get(keys: string[] | null, callback: (items: Record<string, unknown>) => void) {
            callback(Object.fromEntries(Object.entries(data).filter(([key]) => keys === null || keys.includes(key))))
        },
        async set(items: Record<string, unknown>) { Object.assign(data, items) },
        async remove(keys: string[]) { for (const key of keys) delete data[key] }
    }
}

function stubChrome(sync: Record<string, unknown>, local: Record<string, unknown>) {
    const storage = { sync: area(sync), local: area(local) }
    ;(globalThis as any).chrome = { storage }
    return storage
}

test("moves sync data to local, keeps local values on conflict, and clears sync", async () => {
    const { sync, local } = stubChrome(
        { openai_key: '"sk-old"', active_provider: '"openai"' },
        { active_provider: '"gemini"' }
    )

    assert.equal(await migrateSyncToLocal(), 2)
    assert.deepEqual(local.data, { active_provider: '"gemini"', openai_key: '"sk-old"' })
    assert.deepEqual(sync.data, {})
})

test("is idempotent", async () => {
    const { sync, local } = stubChrome({ openai_key: '"sk-old"' }, {})
    assert.equal(await migrateSyncToLocal(), 1)

    assert.equal(await migrateSyncToLocal(), 0)
    assert.deepEqual(local.data, { openai_key: '"sk-old"' })
    assert.deepEqual(sync.data, {})
})
