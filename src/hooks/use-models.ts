import { useQuery } from "@tanstack/react-query"
import { API_ENDPOINTS } from "~lib/constants"

export interface Model {
    id: string
    name: string
    pricing?: {
        prompt: string
        completion: string
    }
    architecture?: {
        modality: string
        tokenizer?: string
        instruct_type?: string
    }
    input_modalities?: string[]
    output_modalities?: string[]
}

// Generic fetcher function
async function fetchModels(
    url: string,
    apiKey: string | undefined,
    transform: (data: any) => Model[],
    headers: Record<string, string> = {}
) {
    if (!url) return []
    // If apiKey is required (implied by being passed as undefined for public APIs), check it
    // But here we rely on the hook's `enabled` state mostly.

    const finalHeaders = { ...headers }
    if (apiKey) {
        finalHeaders["Authorization"] = `Bearer ${apiKey}`
    }

    const res = await fetch(url, { headers: finalHeaders })
    if (!res.ok) throw new Error(`Failed to fetch models from ${url}`)
    const data = await res.json()
    return transform(data)
}

export function useOpenAIModels(apiKey: string) {
    return useQuery({
        queryKey: ["openai-models", apiKey],
        queryFn: () => fetchModels(
            API_ENDPOINTS.openai.models,
            apiKey,
            (data) => data.data
                .filter((m: any) => m.id.includes("gpt"))
                .sort((a: any, b: any) => a.id.localeCompare(b.id))
                .map((m: any) => ({ id: m.id, name: m.id }))
        ),
        enabled: !!apiKey,
        staleTime: 1000 * 60 * 60
    })
}

export function useOpenRouterModels() {
    return useQuery({
        queryKey: ["openrouter-models"],
        queryFn: () => fetchModels(
            API_ENDPOINTS.openrouter.models,
            undefined,
            (data) => {
                // Filter for text-only models using API fields
                const textModels = data.data.filter((m: any) => {
                    // Method 1: Check architecture.modality
                    if (m.architecture?.modality === "text->text") {
                        return true
                    }

                    // Method 2: Check input/output modalities arrays (fallback)
                    const inputIsTextOnly =
                        Array.isArray(m.input_modalities) &&
                        m.input_modalities.length === 1 &&
                        m.input_modalities[0] === "text"

                    const outputIsTextOnly =
                        Array.isArray(m.output_modalities) &&
                        m.output_modalities.length === 1 &&
                        m.output_modalities[0] === "text"

                    return inputIsTextOnly && outputIsTextOnly
                })

                // Curated list of best translation models (prioritized)
                const translationChampions = [
                    'google/gemini-2.0-flash-exp:free',
                    'google/gemini-2.5-flash:free',
                    'google/gemini-flash-1.5',
                    'openai/gpt-4o',
                    'openai/gpt-4o-mini',
                    'qwen/qwen3-235b',
                    'qwen/qwen-2.5-72b-instruct',
                    'meta-llama/llama-3.1-8b-instruct:free',
                    'meta-llama/llama-3.2-3b-instruct:free',
                    'mistralai/mistral-nemo'
                ]

                // Sort: champions first, then free models, then alphabetically
                return textModels
                    .sort((a: any, b: any) => {
                        const aIsChampion = translationChampions.includes(a.id)
                        const bIsChampion = translationChampions.includes(b.id)

                        if (aIsChampion && !bIsChampion) return -1
                        if (!aIsChampion && bIsChampion) return 1

                        if (aIsChampion && bIsChampion) {
                            return translationChampions.indexOf(a.id) - translationChampions.indexOf(b.id)
                        }

                        const aFree = a.pricing?.prompt === "0"
                        const bFree = b.pricing?.prompt === "0"
                        if (aFree && !bFree) return -1
                        if (!aFree && bFree) return 1
                        return a.name.localeCompare(b.name)
                    })
                    .map((m: any) => ({
                        id: m.id,
                        name: m.name + (translationChampions.includes(m.id) ? ' ⭐' : ''),
                        pricing: m.pricing,
                        architecture: m.architecture,
                        input_modalities: m.input_modalities,
                        output_modalities: m.output_modalities
                    }))
            }
        ),
        staleTime: 1000 * 60 * 60
    })
}

export function useGeminiModels(apiKey: string) {
    return useQuery({
        queryKey: ["gemini-models", apiKey],
        queryFn: async () => {
            if (!apiKey) return []
            const res = await fetch(`${API_ENDPOINTS.gemini.base}?key=${apiKey}`)
            if (!res.ok) throw new Error("Failed to fetch Gemini models")
            const data = await res.json()
            return data.models
                .filter((m: any) => m.name.includes("gemini"))
                .map((m: any) => ({
                    id: m.name.replace("models/", ""),
                    name: m.displayName
                }))
        },
        enabled: !!apiKey,
        staleTime: 1000 * 60 * 60
    })
}

export function useGroqModels(apiKey: string) {
    return useQuery({
        queryKey: ["groq-models", apiKey],
        queryFn: () => fetchModels(
            API_ENDPOINTS.groq.models,
            apiKey,
            (data) => data.data
                .sort((a: any, b: any) => a.id.localeCompare(b.id))
                .map((m: any) => ({ id: m.id, name: m.id }))
        ),
        enabled: !!apiKey,
        staleTime: 1000 * 60 * 60
    })
}
