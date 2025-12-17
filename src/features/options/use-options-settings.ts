import { useState, useEffect, useCallback } from "react"
import { Storage } from "@plasmohq/storage"
import { useOpenAIModels, useOpenRouterModels, useGeminiModels, useGroqModels } from "~hooks/use-models"
import { DEFAULTS, PROVIDERS } from "~lib/constants"
import type { TranslationProvider } from "~lib/llm-types"

const storage = new Storage()

export function useOptionsSettings() {
    const [isLoading, setIsLoading] = useState(true)
    const [activeProvider, setActiveProvider] = useState("openrouter")
    const [keys, setKeys] = useState<Record<string, string>>({})
    const [keyExists, setKeyExists] = useState<Record<string, boolean>>({})
    const [model, setModel] = useState("")
    const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({})

    // Model hooks
    const activeKey = keys[activeProvider] || ""
    const { data: openRouterModels, isLoading: isLoadingOpenRouter } = useOpenRouterModels()
    const { data: openAIModels, isLoading: isLoadingOpenAI } = useOpenAIModels(activeProvider === "openai" ? activeKey : "")
    const { data: geminiModels, isLoading: isLoadingGemini } = useGeminiModels(activeProvider === "gemini" ? activeKey : "")
    const { data: groqModels, isLoading: isLoadingGroq } = useGroqModels(activeProvider === "groq" ? activeKey : "")

    const loadSettings = useCallback(async () => {
        setIsLoading(true)
        try {
            const [savedActiveProvider, ...loadedKeysValues] = await Promise.all([
                storage.get("active_provider"),
                ...PROVIDERS.map(p => storage.get(`${p.id}_key`))
            ])

            const currentActiveProvider = savedActiveProvider || "openrouter"
            setActiveProvider(currentActiveProvider)

            const newKeys: Record<string, string> = {}
            const newKeyExists: Record<string, boolean> = {}

            PROVIDERS.forEach((p, index) => {
                const k = loadedKeysValues[index]
                if (k) {
                    newKeys[p.id] = k
                    newKeyExists[p.id] = true
                } else {
                    newKeyExists[p.id] = false
                }
            })

            setKeys(newKeys)
            setKeyExists(newKeyExists)

            const savedModel = await storage.get(`${currentActiveProvider}_model`)
            setModel(savedModel || DEFAULTS[currentActiveProvider as keyof typeof DEFAULTS])

        } catch (error) {
            console.error("Failed to load settings:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const handleActiveProviderChange = async (newProvider: string) => {
        setActiveProvider(newProvider)
        await storage.set("active_provider", newProvider)
        const savedModel = await storage.get(`${newProvider}_model`)
        setModel(savedModel || DEFAULTS[newProvider as keyof typeof DEFAULTS])
    }

    const handleKeyChange = (providerId: string, value: string) => {
        setKeys(prev => ({ ...prev, [providerId]: value }))
        setSavedStatus(prev => ({ ...prev, [providerId]: false }))
    }

    const saveKey = async (providerId: string) => {
        const value = keys[providerId]
        await storage.set(`${providerId}_key`, value)

        const newKeyExists = { ...keyExists, [providerId]: !!value }
        setKeyExists(newKeyExists)

        if (value) {
            const previousKeyCount = Object.values(keyExists).filter(Boolean).length
            const isFirstKey = previousKeyCount === 0

            setActiveProvider(providerId)
            await storage.set("active_provider", providerId)

            const defaultModel = DEFAULTS[providerId as keyof typeof DEFAULTS]
            setModel(defaultModel)
            await storage.set(`${providerId}_model`, defaultModel)

            if (isFirstKey) {
                await storage.set("preferred_translation_provider", "ai")
            }
        }

        if (!value && activeProvider === providerId) {
            const nextProvider = PROVIDERS.find(p => p.id !== providerId && newKeyExists[p.id])
            if (nextProvider) {
                setActiveProvider(nextProvider.id)
                await storage.set("active_provider", nextProvider.id)
                const nextModel = await storage.get(`${nextProvider.id}_model`) || DEFAULTS[nextProvider.id as keyof typeof DEFAULTS]
                setModel(nextModel)
            } else {
                setActiveProvider("openrouter")
                await storage.set("active_provider", "openrouter")
                setModel(DEFAULTS.openrouter)
            }
        }

        setSavedStatus(prev => ({ ...prev, [providerId]: true }))
        setTimeout(() => {
            setSavedStatus(prev => ({ ...prev, [providerId]: false }))
        }, 2000)
    }

    const handleModelChange = async (newModel: string) => {
        setModel(newModel)
        await storage.set(`${activeProvider}_model`, newModel)
    }

    const getModels = useCallback(() => {
        switch (activeProvider) {
            case "openrouter": return openRouterModels || []
            case "openai": return openAIModels || []
            case "gemini": return geminiModels || []
            case "groq": return groqModels || []
            default: return []
        }
    }, [activeProvider, openRouterModels, openAIModels, geminiModels, groqModels])

    const isLoadingModels = useCallback(() => {
        switch (activeProvider) {
            case "openrouter": return isLoadingOpenRouter
            case "openai": return isLoadingOpenAI && !!activeKey
            case "gemini": return isLoadingGemini && !!activeKey
            case "groq": return isLoadingGroq && !!activeKey
            default: return false
        }
    }, [activeProvider, isLoadingOpenRouter, isLoadingOpenAI, isLoadingGemini, isLoadingGroq, activeKey])

    const currentModels = getModels()
    const loadingModels = isLoadingModels()
    const isModelMissing = !model || (currentModels.length > 0 && !currentModels.find((m: any) => m.id === model))

    useEffect(() => {
        const autoSelectModel = async () => {
            if (!loadingModels && currentModels.length > 0 && isModelMissing) {
                const firstModel = currentModels[0]
                if (firstModel) {
                    setModel(firstModel.id)
                    await storage.set(`${activeProvider}_model`, firstModel.id)
                }
            }
        }
        autoSelectModel()
    }, [currentModels, loadingModels, activeProvider, isModelMissing])

    return {
        isLoading,
        activeProvider,
        keys,
        keyExists,
        model,
        savedStatus,
        handleActiveProviderChange,
        handleKeyChange,
        saveKey,
        handleModelChange,
        currentModels,
        loadingModels,
        isModelMissing
    }
}
