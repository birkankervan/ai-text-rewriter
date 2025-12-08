# Smart Translate & Rewrite

**Smart Translate & Rewrite** is a powerful browser extension designed to enhance your writing and reading experience specifically for the web. Whether you need to polish an email, fix grammar in a form, or translate a foreign article, this tool integrates seamlessly into your browsing workflow.

Built with [Plasmo](https://docs.plasmo.com/), React, and TypeScript.

## 🚀 Key Features

### ✍️ Intelligent Rewriting
- **Context-Aware**: Automatically detects when you are typing in an input field or textarea.
- **Floating Rewrite Button**: Appears unobtrusively when you select editable text.
- **Multiple Modes**:
  - **Fix Grammar**: Corrects errors without changing the style.
  - **Professional**: Makes text more formal and polished.
  - **Casual**: Relaxes the tone for friendly communication.
  - **Shorter/Longer**: Adjusts the length of your text.
- **Direct Replacement**: Instantly replaces selected text with the AI-generated version.

### 🌐 Seamless Translation
- **Instant Translation**: Select any static text on a webpage to see the "Translate" button.
- **Pop-up Interface**: View translations in a clean, draggable modal without leaving the page.
- **Language Detection**: Automatically detects the source language.

### 🧠 Multi-LLM Support
Connect your preferred AI provider. We strictly use your own API keys for privacy and control:
- **OpenRouter** (Recommended for access to Claude, GPT-4, etc.)
- **OpenAI** (GPT-4o, GPT-3.5)
- **Google Gemini** (Flash, Pro)
- **Groq** (Llama 3, Mixtral - High speed)

### 💾 History & Privacy
- **Local History**: All rewrites and translations are saved locally on your device using IndexedDB.
- **Privacy First**: Your API keys are stored in your browser's local storage and are never sent to any third-party server other than the AI provider you interact with.

## 🛠️ Tech Stack

- **Framework**: [Plasmo](https://docs.plasmo.com/) (Browser Extension SDK)
- **Frontend**: React 18, TypeScript, TailwindCSS
- **State Management**: React Query, Plasmo Storage
- **Database**: IndexedDB (via `idb`)
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- pnpm (recommended) or npm

### Development Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-text-rewriter
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the Development Server**
   ```bash
   pnpm dev
   ```
   - This will watch for file changes and rebuild automatically.
   - Load the unpacked extension in Chrome from `build/chrome-mv3-dev`.

4. **Build for Production**
   ```bash
   pnpm build
   ```
   - The optimized production build will be generated in `build/chrome-mv3-prod`.

## ⚙️ Configuration

1. After installing the extension, right-click the extension icon and select **Options**.
2. **Provider Setup**:
   - Select your preferred "Active Provider" (e.g., OpenRouter).
   - Enter your API Key for that provider and click "Save".
3. **Preferences**:
   - Set your default target languages for rewriting and translation.
   - Choose specific models for each provider if desired.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
