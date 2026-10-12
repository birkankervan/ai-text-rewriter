# Work Roadmap

Statuses: `Planned`, `In progress`, `Blocked`, `Done`, `Rejected`.

Keep this file current. Move an item to `Done` only after its acceptance checks pass, then record the result in `COMPLETED.md`.

## Current baseline

| ID | Work | Status | Acceptance checks |
|---|---|---|---|
| BASE-01 | Prevent hover-triggered provider requests | Done | Opening the modal is the first action that can send selected text |
| BASE-02 | Prevent duplicate and stale rewrite/translation requests | Done | Language changes send one request; an old request cannot overwrite a new one |
| BASE-03 | Improve controlled input replacement | Done | Replacement uses the native input/textarea setter and emits input events |
| BASE-04 | Make history writes non-blocking | Done | A history failure does not turn a valid result into an error |
| BASE-05 | Improve API key setup | Done | Saving a key activates its provider and opens model selection |
| BASE-06 | Remember the last rewrite tone and language | Done | Popup and in-page rewrite restore the last valid choices |
| BASE-07 | Harden rewrite and translation prompts | Done | Meaning and structured values are preserved; source text is treated as data |

## 1.1 — Speed and control

| ID | Work | Priority | Status | Smallest scope | Acceptance checks |
|---|---|---:|---|---|---|
| UX-01 | Keyboard shortcuts | P0 | Planned | Rewrite, translate, and grammar-fix selected text | Each command opens the existing flow; shortcuts are user-remappable |
| UX-02 | Selection context menu | P0 | Planned | Rewrite, grammar fix, translate to last language | Items appear only for selected text and reuse the current modal/service flow |
| UX-03 | Undo replacement | P0 | Planned | Keep the previous value and range in memory | One click restores the last replacement when the target still exists |
| UX-04 | Disable on this site | P0 | Planned | Exact hostname allow/deny setting | Disabled sites attach no selection UI and send no requests |
| UX-05 | Simplify provider setup | P0 | Done | Put API keys first and keep provider/model selection separate | Saving a key has no hidden provider or model side effects; the setup order is clear |
| UX-06 | Curate Gemini models | P0 | Done | Show a small stable text-generation set suited to translation | Image, audio, embedding, preview, and unsupported Gemini models are hidden |
| FIX-01 | Remove unavailable Gemini models | P0 | Rejected | Keep the supported Gemini 2.5 text family | Research confirmed Gemini 3.8 Flash is GA and supported; removing it hid the real integration error |
| FIX-02 | Diagnose Gemini 3.8 Flash | P0 | Done | Restore the option and identify the actual API failure | The failure reason is evidenced and the model works or reports an actionable error |
| FIX-03 | Retry transient Gemini failures | P0 | Done | Retry Gemini 503 responses twice with backoff | Temporary provider overload recovers without duplicate user actions; persistent failures remain visible |
| UX-07 | Refresh Gemini recommendations | P0 | Done | Prefer current Flash and Flash-Lite text models | Four current models are labeled by use case and Gemini 3.5 Flash is the default |
| UX-08 | Recent rewrites accordion | P0 | Done | Show the latest 10 rewrites below the rewrite flow | Popup and in-page rewrite show recent results; View all opens filtered history |
| UX-09 | Apple Liquid Glass redesign | P0 | Done | Replace gradient-heavy UI with a restrained Apple-inspired material system | Popup, in-page flow, options, and history share accessible glass navigation and calm content surfaces |
| UX-10 | Compact popup command panel | P0 | Done | Separate app chrome from Rewrite/Translate modes and remove nested cards | Popup opens as one focused surface with progressive results and clear provider setup |
| UX-11 | tvOS-inspired popup | P0 | Done | Add cinematic focus, pointer illumination, and a large white action | Popup feels vivid without hiding actions behind hover or reintroducing decorative clutter |
| UX-12 | Appearance and focus lighting | P0 | Done | Add System/Light/Dark, optional OLED black, compact pointer light, and delegated edge glow | Appearance applies across extension surfaces; pointer effects use one animation frame and respect reduced motion |
| FIX-04 | Correct tab and light-mode focus effects | P0 | Done | Animate the Rewrite/Translate selection pill and use dark illumination in light mode | The tab indicator visibly slides; light-mode ambient and edge glow are dark |
| FIX-05 | Tune and control pointer lighting | P0 | Done | Reduce ambient light, strengthen local edge glow, and add an appearance toggle | Disabled lighting performs no pointer-frame work; enabled edge glow is visible near borders |
| FIX-06 | Reflect pointer light from borders | P0 | Done | Add a subtle outer reflection driven by existing edge proximity | Nearby borders softly reflect the pointer light without extra listeners or animation frames |
| FIX-07 | Localize border reflection | P0 | Done | Light only the small border segment touched by the pointer light | Borders stay 1px; no whole-outline flash or thickness change occurs |
| UI-01 | Unify segmented controls | P0 | Done | Use one animated component for all mutually exclusive choices | Rewrite/Translate, AI/Free, appearance, popup settings, and history share behavior and selected hover remains legible |
| UI-02 | Apply interaction system everywhere | P0 | Done | Share appearance, pointer lighting, local border reflection, and controls across all extension surfaces | Popup, options/history, and in-page modal use one implementation and respect the same settings |
| FIX-08 | Repair and compact API key settings | P0 | Done | Prevent pointer styles from changing layout and simplify the provider rows | Show stays inside the field; API key management is compact and visually single-level |
| FIX-09 | Design hygiene fixes | P0 | Done | Class-based dark mode, accessible in-page modal, modal placement, dead animation classes, light-mode error contrast, keyboard-reachable controls, popup translate default, missing prefixes, naming, dead code | Dark mode follows the app setting; modal closes with Escape and does not cover the selection; controls are keyboard-reachable; results keep line breaks |
| UX-13 | Options page redesign | P0 | Done | Replace sidebar with the popup-style header, merge API keys and active provider into one provider → key → model flow, regroup defaults and appearance | One screen shows provider choice, key state, and model together; options matches popup styling in light and dark; no text is unreadable |
| UX-14 | History page redesign | P0 | Done | Match the new options layout: day-grouped list with readable result/original, copy and delete per item, inline clear confirmation | Long entries are not clipped; filters and search show the filtered count; no browser confirm() dialog |
| BRAND-01 | New extension icon | P0 | Done | One new mark (Codex image generation, or a hand-built SVG if Codex is unavailable), exported to `assets/icon.png` | Reads clearly at 16px and 128px in light and dark toolbars; matches the monochrome tvOS UI |
| BRAND-02 | Store screenshots and promo tiles | P0 | Done | 1280×800 screenshots from the real UI plus 440×280 and 1400×560 promo tiles | Images show current UI, meet Chrome Web Store sizes, and carry one short message each |
| BRAND-03 | Store listing copy | P0 | Done | Rewrite `store_listings.md` for the current product | Within store character limits, no promises the extension does not keep, privacy claims match the code |
| UI-03 | Monochrome in-page primary and provider names | P0 | Done | In-page primary action uses the label/surface inverse; history shows provider display names | No blue primary button outside the popup accent states; history never shows raw provider ids |
| CI-01 | Release zip carries the bumped version | P0 | Done | Build job checks out the tag created by version-bump | The zip attached to release vX.Y.Z has manifest version X.Y.Z |
| SEC-01 | Keep API keys out of Chrome Sync | P0 | Done | Store provider keys in `chrome.storage.local` and migrate existing synced keys | Keys never appear in `chrome.storage.sync`; existing users keep working keys after update |
| PRIV-02 | Correct the privacy policy | P0 | Done | Disclose free Google Translate, real storage areas, host permissions, and 15-day history | Every statement in `docs/PRIVACY_POLICY.md` matches the code and the store data disclosure |
| PRIV-01 | History controls | P0 | Planned | Save history toggle plus 1/7/15/30-day retention | Disabled history creates no records; cleanup follows the selected period |
| TEST-01 | Critical flow tests | P0 | Planned | Prompt output, stale requests, single language-change request, history failure | Tests fail on the known regressions and run in CI |

## 1.2 — Rewrite quality

| ID | Work | Priority | Status | Smallest scope | Acceptance checks |
|---|---|---:|---|---|---|
| RW-01 | Before/after view | P1 | Planned | Show original and result together | User can compare before replacing or copying |
| RW-02 | Custom presets | P1 | Planned | Name, instruction, target language | A saved preset can transform selected text through the existing prompt flow |
| RW-03 | Protected terms glossary | P1 | Planned | Global source/target term pairs | Terms present in the source are preserved or translated as configured |
| RW-04 | Optional alternative result | P2 | Planned | One explicit “Alternative” action | No extra provider request occurs until the user clicks it |

## 1.3 — Long-form workspace

| ID | Work | Priority | Status | Smallest scope | Acceptance checks |
|---|---|---:|---|---|---|
| PANEL-01 | Chrome side panel | P1 | Planned | Long text editor, rewrite, translate, history | Uses shared feature components and keeps draft text while switching tabs |
| PANEL-02 | Selected-section summary | P2 | Planned | Short summary and key points | Available only in the side panel and only after explicit user action |

## 2.0 — Page translation

| ID | Work | Priority | Status | Smallest scope | Acceptance checks |
|---|---|---:|---|---|---|
| PAGE-01 | Bilingual visible-page translation | P2 | Planned | Visible paragraphs and headings only | Original layout remains usable and all changes can be reverted |
| PAGE-02 | Dynamic page support | P3 | Planned | Process newly visible supported blocks | No duplicate translations and bounded observer work |

## Explicitly out of scope

| ID | Idea | Status | Reason |
|---|---|---|---|
| NO-01 | User accounts and custom backend | Rejected | High privacy and maintenance cost without improving the core flow |
| NO-02 | Cloud API-key sync | Rejected | API keys are sensitive and should stay local |
| NO-03 | AI detector or separate “humanizer” | Rejected | Weak reliability and overlaps with rewrite modes |
| NO-04 | Automatic grammar requests while typing | Rejected | Sends text without a clear action and creates uncontrolled API cost |
| NO-05 | Screenshot OCR and PDF processing | Rejected | Large scope outside the current text-selection workflow |
