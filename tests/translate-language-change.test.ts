import assert from "node:assert/strict"
import { mock, test } from "node:test"
import type { PromptOptions } from "~lib/prompt-utils"

// TranslateView rendered with a tiny hook runtime instead of React + a DOM:
// state persists between renders and effects run when their deps change.
const slots: unknown[] = []
let slot = 0
let pendingEffects: (() => void)[] = []
const fakeReact = {
    useState(initial: unknown) {
        const index = slot++
        if (!(index in slots)) slots[index] = initial
        return [slots[index], (next: unknown) => { slots[index] = typeof next === "function" ? next(slots[index]) : next }]
    },
    useEffect(effect: () => void, deps: unknown[]) {
        const index = slot++
        const previous = slots[index] as unknown[] | undefined
        if (!previous || deps.some((dep, i) => !Object.is(dep, previous[i]))) {
            slots[index] = deps
            pendingEffects.push(effect)
        }
    },
    useCallback: (callback: unknown) => callback,
    useMemo: (factory: () => unknown) => factory()
}
type Element = { type: unknown, props: Record<string, any> }
const jsx = (type: unknown, props: Record<string, unknown>): Element => ({ type, props })
const Icon = () => null

const requests: PromptOptions[] = []
const generate = (_text: string, options: PromptOptions) => { requests.push(options) }
const llm = { generate, isLoading: false, error: null, data: "" }

// node:test module mocks need --experimental-test-module-mocks; @types/node 20 does not type mock.module yet
const mockModule = (mock as any).module.bind(mock)
mockModule("react", { namedExports: fakeReact })
mockModule("react/jsx-runtime", { namedExports: { jsx, jsxs: jsx, Fragment: "fragment" } })
mockModule("lucide-react", { namedExports: { ArrowRight: Icon, Check: Icon, Copy: Icon, Globe: Icon, AlertCircle: Icon } })
mockModule("~hooks/use-llm", { namedExports: { useLLM: () => llm } })

function findSelect(node: unknown): Element | undefined {
    if (Array.isArray(node)) return node.map(findSelect).find(Boolean)
    if (!node || typeof node !== "object") return undefined
    const element = node as Element
    return element.type === "select" ? element : findSelect(element.props.children)
}

test("changing the target language starts exactly one translation request", async () => {
    const { TranslateView } = await import("~features/translate-view")
    const render = () => {
        slot = 0
        const tree = TranslateView({ initialText: "Hello", apiKey: null, defaultTargetLang: "English" })
        const effects = pendingEffects
        pendingEffects = []
        effects.forEach(effect => effect())
        return tree
    }

    render()
    assert.deepEqual(requests, [{ mode: "translate", targetLang: "English" }])

    findSelect(render())!.props.onChange({ target: { value: "German" } })
    render()
    assert.deepEqual(requests, [
        { mode: "translate", targetLang: "English" },
        { mode: "translate", targetLang: "German" }
    ])

    findSelect(render())!.props.onChange({ target: { value: "German" } })
    render()
    assert.equal(requests.length, 2)
})
