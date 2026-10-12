// chrome.* shim + canned provider responses so the built extension bundles render outside the extension.
// Nothing here talks to a real provider: fetch to provider hosts and runtime messages are answered locally.
(function () {
  const params = new URLSearchParams(location.search)
  const theme = params.get("theme") || "dark"

  const saved = {
    active_provider: '"gemini"',
    gemini_key: '"AIzaSyDemoKey00000000000000000000x7Qe"',
    gemini_model: '"gemini-3.5-flash"',
    appearance_mode: JSON.stringify(theme),
    appearance_pointer_lighting: '"false"',
    default_lang_translate: '"Spanish"',
    last_rewrite_tone: JSON.stringify(params.get("tone") || "Professional")
  }

  // Canned results, matched by a phrase from the selected text.
  const REWRITES = [
    ["launch doc", "I've reviewed the launch plan, and I recommend moving the release back one week. There are still 12 open bugs, and QA hasn't signed off yet."],
    ["report by friday", "Hi Priya! Could you send me the report by Friday? I'd love to have it ready for Monday's board meeting. Thanks so much!"]
  ]
  const TRANSLATIONS = [
    ["twenty minutes", "Al final, los investigadores descubrieron que quienes pasaban veinte minutos al día en un parque tenían menos estrés al cabo de solo dos semanas, hicieran o no ejercicio allí."]
  ]
  const pick = (table, text) => (table.find(([k]) => text.toLowerCase().includes(k)) || [null, text])[1]

  const GEMINI_MODELS = [
    ["gemini-3.5-flash", "Gemini 3.5 Flash"],
    ["gemini-3.8-flash", "Gemini 3.8 Flash"],
    ["gemini-3.5-flash-lite", "Gemini 3.5 Flash-Lite"],
    ["gemini-3.1-flash-lite", "Gemini 3.1 Flash-Lite"]
  ].map(([id, displayName]) => ({ name: `models/${id}`, displayName, supportedGenerationMethods: ["generateContent"] }))

  const sse = (text) => {
    const words = text.match(/\S+\s*/g) || []
    const enc = new TextEncoder()
    return new Response(new ReadableStream({
      async start(c) {
        for (const w of words) {
          c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: w }] } }] })}\n\n`))
          await new Promise(r => setTimeout(r, 8))
        }
        c.close()
      }
    }), { headers: { "Content-Type": "text/event-stream" } })
  }

  const realFetch = window.fetch.bind(window)
  window.fetch = async (input, init = {}) => {
    const url = String(input && input.url || input)
    if (url.includes("generativelanguage.googleapis.com")) {
      if (url.includes(":streamGenerateContent")) return sse(pick(REWRITES, String(init.body || "")))
      return new Response(JSON.stringify({ models: GEMINI_MODELS }), { headers: { "Content-Type": "application/json" } })
    }
    if (/openrouter\.ai|api\.openai\.com|api\.groq\.com|translate\.googleapis/.test(url)) {
      return new Response(JSON.stringify({ data: [] }), { headers: { "Content-Type": "application/json" } })
    }
    return realFetch(input, init)
  }

  const onMessage = (msg) => {
    switch (msg && msg.name) {
      case "free-translate": return { success: true, translatedText: pick(TRANSLATIONS, msg.body.text) }
      case "save-history": return { success: true }
      case "get-recent-history": return { success: true, items: [] }
      default: return {}
    }
  }

  const listeners = []
  const area = (name) => ({
    get(keys, cb) {
      const out = {}
      const ks = keys == null ? Object.keys(saved) : typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys)
      ks.forEach(k => { if (k in saved) out[k] = saved[k] })
      const p = Promise.resolve(out); if (cb) p.then(cb); return p
    },
    set(items, cb) {
      const changes = {}
      for (const k in items) { changes[k] = { oldValue: saved[k], newValue: items[k] }; saved[k] = items[k] }
      setTimeout(() => listeners.forEach(l => l(changes, name)))
      const p = Promise.resolve(); if (cb) p.then(cb); return p
    },
    remove(keys, cb) { [].concat(keys).forEach(k => delete saved[k]); const p = Promise.resolve(); if (cb) p.then(cb); return p },
    clear() { return Promise.resolve() },
    onChanged: { addListener() {}, removeListener() {} }
  })

  window.chrome = {
    storage: {
      sync: area("sync"), local: area("local"), session: area("session"),
      onChanged: { addListener: l => listeners.push(l), removeListener: l => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1) } }
    },
    runtime: {
      id: "shim",
      getURL: p => "/ext/" + p,
      sendMessage: (...args) => Promise.resolve(onMessage(args.find(a => a && typeof a === "object"))),
      onMessage: { addListener() {}, removeListener() {} },
      openOptionsPage() {}
    }
  }
})()
