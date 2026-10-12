// Lets `node --test` load the extension source: maps the `~` alias to src/, adds the
// .ts/.tsx extension the source omits, and compiles .tsx (Node only strips types, not JSX).
import { readFileSync, statSync } from "node:fs"
import { registerHooks } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"

const src = new URL("../src/", import.meta.url)

registerHooks({
    resolve(specifier, context, nextResolve) {
        const base = specifier.startsWith("~") ? new URL(specifier.slice(1), src)
            : specifier.startsWith(".") && context.parentURL?.includes("/src/") ? new URL(specifier, context.parentURL)
            : null
        const match = base && ["", ".ts", ".tsx"].map(ext => fileURLToPath(base) + ext).find(path => statSync(path, { throwIfNoEntry: false })?.isFile())
        return match ? { url: pathToFileURL(match).href, shortCircuit: true } : nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
        const { pathname } = new URL(url)
        // Project .ts files are ES modules; saying so skips Node's CommonJS-then-ESM reparse
        if (pathname.endsWith(".ts") && !pathname.includes("/node_modules/")) return nextLoad(url, { ...context, format: "module-typescript" })
        if (!pathname.endsWith(".tsx")) return nextLoad(url, context)
        const { outputText } = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
            compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true }
        })
        return { format: "module", source: outputText, shortCircuit: true }
    }
})
