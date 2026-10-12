import { Storage } from "@plasmohq/storage"

// Plasmo defaults to chrome.storage.sync, which would copy API keys into the user's
// Google account. Everything (keys, settings) stays on this device instead.
export const storage = new Storage({ area: "local" })

// One-time move of data written by older versions from sync to local.
// Values are copied raw so Plasmo's JSON encoding is preserved; local wins on conflict.
export async function migrateSyncToLocal() {
    // Callback form: the installed @types/chrome only types get() with a callback
    const synced = await new Promise<Record<string, unknown>>(resolve => chrome.storage.sync.get(null, resolve))
    const keys = Object.keys(synced)
    if (keys.length === 0) return 0

    const existing = await new Promise<Record<string, unknown>>(resolve => chrome.storage.local.get(keys, resolve))
    const missing = Object.fromEntries(Object.entries(synced).filter(([key]) => !(key in existing)))
    await chrome.storage.local.set(missing)
    await chrome.storage.sync.remove(keys)
    return keys.length
}
