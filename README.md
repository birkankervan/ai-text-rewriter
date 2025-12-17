# Smart Translate & Rewrite

> **The privacy-first AI writing assistant for your browser.**
> Fix grammar, paraphrase, and translate text on any website using your own API keys.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Plasmo](https://img.shields.io/badge/Plasmo-Framework-purple)

## 📖 Overview

**Smart Translate & Rewrite** brings the power of advanced AI models (GPT-4, Claude 3.5, Gemini, Llama 3) directly into your browsing workflow. Unlike other tools that require expensive subscriptions, this extension allows you to **Bring Your Own Key (BYOK)**, ensuring you only pay for what you use while keeping your data private.

Whether you are crafting a professional email, fixing grammar in a form, or reading foreign content, Smart Translate & Rewrite helps you communicate effectively and fluently.

## ✨ Key Features

### ✍️ Intelligent Rewriting
Transform your writing instantly by selecting text in any input field:
- **Fix Grammar**: Correct typos and grammatical errors without changing your intent.
- **Professional Mode**: Polish your tone for business communications.
- **Casual Mode**: Relax the tone for friendly chats.
- **Paraphrase**: Rewrite content to sound fresh and unique.
- **Adjust Length**: Shorten verbose paragraphs or expand on simple ideas.

### 🌐 Seamless Translation
Read the web in your language without losing context:
- **Instant Pop-up**: Select any text on a page to see the "Translate" button.
- **In-Context View**: View translations in a clean, draggable modal right next to the original text.
- **Auto-Detection**: Automatically identifies the source language.

### 🔒 Privacy-First & Secure
Your data stays yours. We believe in total transparency:
- **Bring Your Own Key (BYOK)**: Connect directly to OpenAI, Google Gemini, Groq, or OpenRouter.
- **Local Storage**: Your API keys and history are stored **locally** on your device.
- **No Middleman**: Requests go directly from your browser to the AI provider. We do not track your usage.

### 🧠 Multi-Model Support
Choose the smartest models for your needs:
- **OpenRouter** (Access to Claude 3.5 Sonnet, GPT-4o, etc.)
- **OpenAI** (GPT-4o, GPT-3.5 Turbo)
- **Google Gemini** (Gemini 1.5 Pro, Flash)
- **Groq** (Llama 3, Mixtral - Ultra fast)

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

### Development Setup

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
   - Load the unpacked extension in Chrome/Brave/Edge from `build/chrome-mv3-dev`.

4. **Build for Production**
   ```bash
   pnpm build
   ```
   - The optimized production build will be generated in `build/chrome-mv3-prod`.

## ⚙️ Configuration

1. After installing, right-click the extension icon and select **Options**.
2. **Provider Setup**:
   - Select your "Active Provider" (e.g., OpenRouter).
   - Enter your API Key and click **Save**.
3. **Preferences**:
   - Set your default target languages.
   - Choose specific models for each provider (e.g., forcing `gpt-4o`).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
