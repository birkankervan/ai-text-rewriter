# Privacy Policy for Smart Translate & Rewrite

**Last updated:** October 12, 2026

Smart Translate & Rewrite ("the extension") is a browser extension that rewrites and translates text you select. It has no account system, no backend server, and no analytics or tracking. The developer does not receive any of your text, keys, or usage data.

## What leaves your device, and when

Nothing is sent when you only select text. Data is sent only after you click an action such as **Generate**, **Translate**, or the in-page Translate button.

| Data | Sent to | When |
|---|---|---|
| Selected or pasted text, plus the chosen tone and language | The AI provider you connected: OpenRouter, OpenAI, Google Gemini, or Groq | When you run a rewrite, or an AI translation |
| Selected or pasted text and the target language | Google Translate (`translate.googleapis.com`) | When you translate with the free engine. This is the default for translation and needs no key |
| Your API key for a provider | Only that provider, in a request header | With each request to that provider, and when the settings page loads its model list |

Requests go directly from your browser to these services. Their own privacy policies apply to the text they receive:

- OpenRouter: https://openrouter.ai/privacy
- OpenAI: https://openai.com/policies/privacy-policy
- Google (Gemini and Google Translate): https://policies.google.com/privacy
- Groq: https://groq.com/privacy-policy

## What is stored on your device

- **API keys and settings** (active provider, model, default languages, last tone, appearance) are stored in the extension's local storage (`chrome.storage.local`). They are not synced to your Google account or any other device. Versions before 1.0.14 used `chrome.storage.sync`; on update, the extension moves that data to local storage and removes it from sync.
- **API keys are not encrypted** by the extension. Anyone with access to your browser profile could read them.
- **History** of rewrites and translations is stored in the extension's IndexedDB. Each entry contains the original text, the result, the type, the provider and model, the tone or target language, and the time. Entries are deleted automatically after 15 days. You can delete single entries or clear all history on the History page.

Removing the extension deletes all of this data.

## Permissions

- **Content script on all sites:** shows the floating Rewrite/Translate button when you select text on a page, and replaces the text in an editable field when you click Replace. The script does not read pages or send anything until you act.
- **Host access to `openrouter.ai`, `api.openai.com`, `generativelanguage.googleapis.com`, `api.groq.com`, and `translate.googleapis.com`:** lets the extension send your requests to the provider you choose, or to Google Translate.
- **`storage`:** saves your keys and settings on this device.
- **`alarms`:** runs the daily cleanup that deletes history older than 15 days.

## Data sale and sharing

The developer does not collect, sell, or share your data. Text and keys are sent only to the services listed above, and only to fulfil the action you requested.

## Changes

Changes to this policy are published on this page with a new "Last updated" date.

## Contact

Questions: e.birkankervan@gmail.com
