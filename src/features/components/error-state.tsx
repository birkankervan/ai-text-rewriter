import { AlertCircle } from "lucide-react"

export const ErrorState = ({ error, onRetry }: { error: string, onRetry: () => void }) => {
    const isApiKeyError = error === "MISSING_API_KEY"
    const isDataPolicyError = error === "OPENROUTER_DATA_POLICY"

    let errorMessage = "Generation Failed"
    if (isApiKeyError) errorMessage = "API Key Missing"
    if (isDataPolicyError) errorMessage = "Data Collection Required"

    return (
        <div className="plasmo-p-3 plasmo-rounded-xl plasmo-bg-red-500/10 plasmo-border plasmo-border-red-500/30 plasmo-flex plasmo-flex-col plasmo-gap-2 plasmo-animate-in plasmo-fade-in plasmo-slide-in-from-top-2">
            <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-text-red-400">
                <AlertCircle className="plasmo-w-4 plasmo-h-4" />
                <span className="plasmo-text-xs plasmo-font-medium">
                    {errorMessage}
                </span>
            </div>

            {isApiKeyError ? (
                <button
                    onClick={() => window.open(chrome.runtime.getURL("options.html"), "_blank")}
                    className="plasmo-text-xs plasmo-text-white/80 plasmo-underline plasmo-text-left hover:plasmo-text-white">
                    Open Settings
                </button>
            ) : isDataPolicyError ? (
                <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                    <p className="plasmo-text-[10px] plasmo-text-white/60">
                        Free models require data collection to be enabled.
                    </p>
                    <button
                        onClick={() => window.open("https://openrouter.ai/settings/privacy", "_blank")}
                        className="plasmo-text-xs plasmo-text-white/80 plasmo-underline plasmo-text-left hover:plasmo-text-white">
                        Enable in OpenRouter Settings
                    </button>
                </div>
            ) : (
                <button
                    onClick={onRetry}
                    className="plasmo-text-xs plasmo-text-white/80 plasmo-underline plasmo-text-left hover:plasmo-text-white">
                    Try Again
                </button>
            )}
        </div>
    )
}
