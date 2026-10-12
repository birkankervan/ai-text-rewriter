import assert from "node:assert/strict"
import { test } from "node:test"
import { runStreamRequest, type StreamRequestDeps, type StreamState } from "~hooks/stream-request"

const translate = { mode: "translate", targetLang: "German" } as const

// A stream that yields `chunks`, then waits for `release()` before it ends (or throws `error`)
function heldStream(chunks: string[], error?: Error) {
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    async function* stream() {
        yield* chunks
        await held
        if (error) throw error
    }
    return { stream: stream(), release }
}

function harness(overrides: Partial<StreamRequestDeps> = {}) {
    let state: StreamState = { status: "idle" }
    const deps: StreamRequestDeps = {
        activeRef: { current: null },
        setState: next => { state = typeof next === "function" ? next(state) : next },
        translate: () => { throw new Error("no stream queued") },
        saveHistory: async () => {},
        ...overrides
    }
    return { deps, state: () => state }
}

test("a stale request that ends after a newer one starts leaves the newer request alone", async () => {
    const first = heldStream(["Hallo"])
    const second = heldStream(["Bonjour"])
    const streams = [first.stream, second.stream]
    const { deps, state } = harness({ translate: () => streams.shift()! })

    const firstRun = runStreamRequest(deps, "Hello", translate)
    await new Promise(resolve => setImmediate(resolve))
    const secondRun = runStreamRequest(deps, "Hello", { mode: "translate", targetLang: "French" })
    await new Promise(resolve => setImmediate(resolve))
    const secondController = deps.activeRef.current

    first.release()
    await firstRun
    assert.deepEqual(state(), { status: "streaming", data: "Bonjour" })
    assert.equal(deps.activeRef.current, secondController)

    second.release()
    await secondRun
    assert.deepEqual(state(), { status: "complete", data: "Bonjour" })
    assert.equal(deps.activeRef.current, null)
})

test("a stale request that fails after a newer one starts does not show its error", async () => {
    const first = heldStream([], new Error("network down"))
    const second = heldStream(["Bonjour"])
    const streams = [first.stream, second.stream]
    const { deps, state } = harness({ translate: () => streams.shift()! })

    const firstRun = runStreamRequest(deps, "Hello", translate)
    const secondRun = runStreamRequest(deps, "Hello", translate)
    await new Promise(resolve => setImmediate(resolve))

    first.release()
    await firstRun
    assert.deepEqual(state(), { status: "streaming", data: "Bonjour" })

    second.release()
    await secondRun
})

test("a history failure keeps the completed result", async () => {
    const saved: string[] = []
    const { deps, state } = harness({
        translate: async function* () { yield "Hallo " ; yield "Welt" },
        saveHistory: async (_prompt, fullText) => {
            saved.push(fullText)
            throw new Error("IndexedDB unavailable")
        }
    })

    const errors: unknown[] = []
    const originalError = console.error
    console.error = (...args: unknown[]) => { errors.push(args) }
    try {
        await runStreamRequest(deps, "Hello world", translate)
    } finally {
        console.error = originalError
    }

    assert.deepEqual(saved, ["Hallo Welt"])
    assert.deepEqual(state(), { status: "complete", data: "Hallo Welt" })
    assert.equal(errors.length, 1)
})
