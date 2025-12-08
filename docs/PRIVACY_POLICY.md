# Privacy Policy for ai-text-rewriter

**Last Updated:** December 08, 2025

## Introduction
The **ai-text-rewriter** extension ("we", "us", or "our") respects your privacy. This Privacy Policy explains how we handle your data when you use our browser extension.

## Data Collection and Usage
We are transparent about what data we collect and how it is used:

1.  **User Input Data**:
    - When you select text and use the "Rewrite" or "Translate" features, the selected text is sent to the AI provider you have configured (e.g., OpenAI, Google Gemini, Groq, OpenRouter).
    - This data is processed **solely** for the purpose of generating the rewritten or translated text you requested.
    - We do **not** store, harvest, or sell your text inputs on our own servers. The data goes directly from your browser to the chosen AI provider's API.

2.  **API Keys**:
    - Your API keys (e.g., for OpenAI, Gemini) are stored **locally** on your device using Chrome's secure storage API (`chrome.storage.local`).
    - These keys are never transmitted to us or any third party other than the respective API provider for authentication purposes.

3.  **History**:
    - The extension stores a local history of your rewrites and translations within your browser's internal storage (IndexedDB/LocalStorage) to allow you to review past generations.
    - This history stays on your device and is not synced to any cloud server controlled by us.

## Third-Party AI Providers
This extension acts as a client for various AI services. By using a specific provider, you are subject to their respective privacy policies:
- **OpenAI**: [Privacy Policy](https://openai.com/privacy)
- **Google (Gemini)**: [Privacy Policy](https://policies.google.com/privacy)
- **Groq**: [Privacy Policy](https://groq.com/privacy)
- **OpenRouter**: [Privacy Policy](https://openrouter.ai/privacy)

## Permissions
The extension requests the following permissions for specific functionalities:
- **Host Permissions (`<all_urls>`)**: Required to display the floating "Rewrite/Translate" button on any webpage when you select text. The extension injects a lightweight content script to detect text selection events.
- **Storage**: Required to save your preferences, API keys, and history locally.
- **Alarms**: Used to schedule automatic cleanup of old history data.

## Changes to This Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

## Contact Us
If you have any questions about this Privacy Policy, please contact us via our support channels.
