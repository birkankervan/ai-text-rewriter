// Regenerates store-assets/screenshots and store-assets/promo from the built extension.
// Usage: pnpm build && PUPPETEER_CORE=/path/to/node_modules/puppeteer-core node store-assets/source/render.cjs
// puppeteer-core is intentionally not a project dependency; install it in any scratch dir.
const http = require("http")
const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")
const puppeteer = require(process.env.PUPPETEER_CORE || "puppeteer-core")

const ROOT = path.resolve(__dirname, "../..")
const SRC = __dirname
const EXT = path.join(ROOT, "build/chrome-mv3-prod")
const OUT = path.join(ROOT, "store-assets")
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" }

function serve() {
  const contentJs = fs.readdirSync(EXT).find(f => /^content\..*\.js$/.test(f))
  const server = http.createServer((req, res) => {
    if (req.url === "/favicon.ico") { res.writeHead(204); return res.end() }
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname)
    let file
    if (p === "/ext/content.js") file = path.join(EXT, contentJs)
    else if (p.startsWith("/ext/")) file = path.join(EXT, p.slice(5))
    else if (p.startsWith("/icon/")) file = path.join(OUT, "icon", p.slice(6))
    else file = path.join(SRC, p.slice(1))
    // Built pages reference assets from "/", so fall back to the build dir.
    if (!fs.existsSync(file)) file = path.join(EXT, p.slice(1))
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end() }
    let body = fs.readFileSync(file)
    if (file.startsWith(EXT) && file.endsWith(".html")) body = body.toString().replace("<head>", '<head><script src="/shim.js"></script>')
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" })
    res.end(body)
  })
  return new Promise(r => server.listen(0, "127.0.0.1", () => r(server)))
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const frameByUrl = (page, part) => page.frames().find(f => f.url().includes(part))

async function waitFrame(page, part) {
  for (let i = 0; i < 100; i++) { const f = frameByUrl(page, part); if (f) return f; await sleep(50) }
  throw new Error("frame not found: " + part)
}

// Select the target text the way a user would, then click the extension's floating button
// inside its shadow root and wait for the panel to finish.
async function openPanel(frame, { rewrite }) {
  await frame.waitForSelector("plasmo-csui", { timeout: 10000 })
  await frame.evaluate((rewrite) => {
    const el = document.getElementById("target")
    if (rewrite) document.getElementById("body").focus()
    const r = document.createRange(); r.selectNodeContents(el)
    const s = getSelection(); s.removeAllRanges(); s.addRange(r)
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }))
  }, rewrite)
  const btnSel = rewrite ? '[aria-label="Rewrite with AI"]' : '[aria-label="Translate with AI"]'
  const inShadow = (sel) => frame.waitForFunction(s => document.querySelector("plasmo-csui")?.shadowRoot?.querySelector(s), { timeout: 10000 }, sel)
  await (await inShadow(btnSel)).asElement().click()
  if (rewrite) {
    const gen = await frame.waitForFunction(() => [...document.querySelector("plasmo-csui").shadowRoot.querySelectorAll("button")].find(b => b.textContent.trim() === "Generate"), { timeout: 10000 })
    await gen.asElement().click()
    await inShadow("button.apple-primary") // "Replace Text" appears when the stream completes
  } else {
    await frame.waitForFunction(() => {
      const p = document.querySelector("plasmo-csui")?.shadowRoot?.querySelector('[role="button"] p[aria-live]')
      return p && p.textContent.length > 20
    }, { timeout: 10000 })
  }
  await sleep(400)
  const fit = await frame.evaluate(() => {
    const sc = document.querySelector("plasmo-csui").shadowRoot.querySelector('[role="dialog"] .custom-scrollbar')
    return [sc.scrollHeight, sc.clientHeight]
  })
  if (fit[0] > fit[1]) console.log("  panel scrolls:", fit)
}

async function popupRewrite(page) {
  const f = await waitFrame(page, "/ext/popup.html")
  const ta = await f.waitForSelector("textarea", { timeout: 10000 })
  await ta.type("can u send me the report by friday? need it for the board meeting on monday thx")
  const gen = await f.waitForFunction(() => [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Generate"))
  await gen.asElement().click()
  await f.waitForFunction(() => [...document.querySelectorAll("button")].some(b => b.textContent.includes("New Rewrite")), { timeout: 10000 })
  await f.evaluate(() => document.activeElement && document.activeElement.blur())
  await sleep(400)
  const h = await f.evaluate(() => document.querySelector("#__plasmo").scrollHeight)
  await page.evaluate(h => { document.getElementById("popup").style.height = h + "px" }, h)
  return h
}

async function seedHistory(page, base) {
  await page.goto(base + "/shim.js")
  await page.evaluate(async () => {
    const day = 86400000, now = new Date(); const at = (dAgo, h, m) => { const d = new Date(now - dAgo * day); d.setHours(h, m, 0, 0); return +d }
    const items = [
      { type: "rewrite", original: "hey so i think we gotta push the launch a week, theres still 12 open bugs", result: "I recommend moving the launch back one week. There are still 12 open bugs.", timestamp: at(0, 10, 42), provider: "gemini", model: "gemini-3.5-flash", rewriteOptions: { tone: "Professional", fixGrammar: true } },
      { type: "translate", original: "People who spent twenty minutes a day in a park reported lower stress.", result: "Quienes pasaban veinte minutos al día en un parque tenían menos estrés.", timestamp: at(0, 9, 18), provider: "Google Translate", model: "free", translateOptions: { targetLang: "Spanish" } },
      { type: "rewrite", original: "Thanks for the feedback, we will look into it and get back to you.", result: "Thanks so much for flagging this! We're on it and will update you soon.", timestamp: at(0, 8, 5), provider: "gemini", model: "gemini-3.5-flash", rewriteOptions: { tone: "Friendly" } },
      { type: "translate", original: "Bitte bestätigen Sie den Termin bis Mittwoch.", result: "Please confirm the appointment by Wednesday.", timestamp: at(1, 17, 36), provider: "gemini", model: "gemini-3.5-flash", translateOptions: { targetLang: "English" } },
      { type: "rewrite", original: "Our new onboarding flow is designed in order to make it much more easier for new users to get started.", result: "Our new onboarding flow helps new users get started quickly.", timestamp: at(1, 14, 2), provider: "gemini", model: "gemini-3.5-flash", rewriteOptions: { tone: "Concise", fixGrammar: true } },
      { type: "translate", original: "La réunion est reportée à jeudi prochain.", result: "The meeting has been moved to next Thursday.", timestamp: at(1, 11, 27), provider: "Google Translate", model: "free", translateOptions: { targetLang: "English" } }
    ]
    await new Promise((resolve, reject) => {
      const req = indexedDB.open("ai-text-rewriter-db", 1)
      req.onupgradeneeded = () => { const s = req.result.createObjectStore("history", { keyPath: "id", autoIncrement: true }); s.createIndex("by-date", "timestamp") }
      req.onsuccess = () => {
        const tx = req.result.transaction("history", "readwrite"); const st = tx.objectStore("history")
        st.clear(); items.forEach(i => st.add(i))
        tx.oncomplete = () => { req.result.close(); resolve() }; tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  })
}

function flatten(file) {
  // Store rejects alpha: round-trip through JPEG-free BMP keeps pixels exact and drops the alpha channel.
  const tmp = file.replace(/\.png$/, ".bmp")
  execFileSync("sips", ["-s", "format", "bmp", file, "--out", tmp], { stdio: "ignore" })
  execFileSync("sips", ["-s", "format", "png", tmp, "--out", file], { stdio: "ignore" })
  fs.unlinkSync(tmp)
}

async function main() {
  const server = await serve()
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--lang=en-US", "--font-render-hinting=none", "--hide-scrollbars"] })
  const errors = []
  const only = process.argv[2]
  const shoot = async (name, w, h, url, act) => {
    if (only && !name.includes(only)) return
    const page = await browser.newPage()
    page.on("pageerror", e => errors.push(`${name}: ${e.message}`))
    page.on("console", m => { if (m.type() === "error") errors.push(`${name}: ${m.text()}`) })
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }])
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
    if (name.includes("history")) await seedHistory(page, base)
    await page.goto(base + url, { waitUntil: "networkidle0" })
    if (act) await act(page)
    await sleep(300)
    const file = path.join(OUT, name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    await page.screenshot({ path: file, omitBackground: false })
    flatten(file)
    console.log("wrote", name)
    await page.close()
  }

  await shoot("screenshots/01-rewrite.png", 1280, 800, "/shot.html?scene=1", async p => openPanel(await waitFrame(p, "page-compose"), { rewrite: true }))
  await shoot("screenshots/02-translate.png", 1280, 800, "/shot.html?scene=2", async p => openPanel(await waitFrame(p, "page-article"), { rewrite: false }))
  await shoot("screenshots/03-popup.png", 1280, 800, "/shot.html?scene=3", popupRewrite)
  await shoot("screenshots/04-settings.png", 1280, 800, "/shot.html?scene=4", async p => {
    const f = await waitFrame(p, "/ext/options.html")
    await f.waitForFunction(() => document.body.innerText.includes("In use"), { timeout: 10000 })
    await sleep(800)
  })
  await shoot("screenshots/05-history.png", 1280, 800, "/shot.html?scene=5", async p => {
    const f = await waitFrame(p, "/ext/options.html")
    await f.waitForFunction(() => document.querySelectorAll("li.settings-row").length >= 5, { timeout: 10000 })
  })
  await shoot("promo/small-440x280.png", 440, 280, "/promo-small.html")
  await shoot("promo/marquee-1400x560.png", 1400, 560, "/promo-marquee.html", async p => openPanel(await waitFrame(p, "page-compose"), { rewrite: true }))

  await browser.close()
  server.close()
  if (errors.length) { console.log("Console errors:\n" + errors.join("\n")); process.exitCode = 1 }
}

main().catch(e => { console.error(e); process.exit(1) })
