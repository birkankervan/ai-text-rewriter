import { useState, useEffect, type ReactNode } from "react"
import { Storage } from "@plasmohq/storage"
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "~lib/constants"
import type { TranslationProvider } from "~lib/llm-types"
import type { AppearanceMode } from "~hooks/use-appearance"
import { SegmentedControl } from "~components/ui/segmented-control"

const storage = new Storage()

function SettingsSection({ title, children }: { title: string, children: ReactNode }) {
    return (
        <section className="plasmo-flex plasmo-flex-col plasmo-gap-3">
            <h2 className="apple-label plasmo-text-base plasmo-font-semibold">{title}</h2>
            <div className="apple-card settings-group">{children}</div>
        </section>
    )
}

function SettingsRow({ label, hint, htmlFor, children }: { label: string, hint?: string, htmlFor?: string, children: ReactNode }) {
    return (
        <div className="settings-row plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-4 plasmo-px-5 plasmo-py-4 max-sm:plasmo-flex-col max-sm:plasmo-items-stretch">
            <div className="plasmo-min-w-0">
                <label htmlFor={htmlFor} className="apple-label plasmo-block plasmo-text-sm plasmo-font-medium">{label}</label>
                {hint && <p className="apple-muted plasmo-mt-0.5 plasmo-text-xs">{hint}</p>}
            </div>
            <div className="plasmo-shrink-0 sm:plasmo-w-64">{children}</div>
        </div>
    )
}

function LanguageSelect({ id, storageKey, defaultValue }: { id: string, storageKey: string, defaultValue: SupportedLanguage }) {
    const [value, setValue] = useState<SupportedLanguage>(defaultValue)

    useEffect(() => {
        storage.get(storageKey).then((stored) => {
            if (stored) setValue(stored as SupportedLanguage)
        })
    }, [storageKey])

    const handleChange = async (next: SupportedLanguage) => {
        setValue(next)
        await storage.set(storageKey, next)
    }

    return (
        <div className="plasmo-relative">
            <select
                id={id}
                value={value}
                onChange={(e) => handleChange(e.target.value as SupportedLanguage)}
                className="apple-field plasmo-h-10 plasmo-w-full plasmo-appearance-none plasmo-pl-3 plasmo-pr-9 plasmo-text-sm">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                ))}
            </select>
            <ChevronDown className="apple-muted plasmo-pointer-events-none plasmo-absolute plasmo-right-3 plasmo-top-1/2 plasmo-h-4 plasmo-w-4 plasmo--translate-y-1/2" />
        </div>
    )
}

function Switch({ id, checked, onChange }: { id: string, checked: boolean, onChange: () => void }) {
    return (
        <button id={id} type="button" role="switch" aria-checked={checked} onClick={onChange} className="settings-switch">
            <span className="settings-switch-knob" />
        </button>
    )
}

function TranslationEngine({ hasAnyKey }: { hasAnyKey: boolean }) {
    const [provider, setProvider] = useState<TranslationProvider>("free")

    useEffect(() => {
        storage.get("preferred_translation_provider").then((stored) => {
            if (stored) setProvider(stored as TranslationProvider)
        })
    }, [])

    const handleChange = async (next: TranslationProvider) => {
        if (next === "ai" && !hasAnyKey) return
        setProvider(next)
        await storage.set("preferred_translation_provider", next)
    }

    return (
        <SegmentedControl
            ariaLabel="Translation engine"
            value={provider}
            onChange={handleChange}
            options={[
                { value: "free", label: "Google Translate" },
                { value: "ai", label: "AI provider", disabled: !hasAnyKey, title: !hasAnyKey ? "Connect an AI provider first" : undefined }
            ]}
        />
    )
}

function useAppearanceSettings() {
    const [mode, setMode] = useState<AppearanceMode>("system")
    const [oled, setOled] = useState(false)
    const [pointerLighting, setPointerLighting] = useState(true)

    useEffect(() => {
        Promise.all([storage.get("appearance_mode"), storage.get("appearance_oled"), storage.get("appearance_pointer_lighting")]).then(([savedMode, savedOled, savedPointerLighting]) => {
            if (["system", "light", "dark"].includes(savedMode)) setMode(savedMode as AppearanceMode)
            setOled(savedOled === "true" || (savedOled as unknown) === true)
            setPointerLighting(savedPointerLighting !== "false" && (savedPointerLighting as unknown) !== false)
        })
    }, [])

    return {
        mode,
        oled,
        pointerLighting,
        selectMode: async (next: AppearanceMode) => {
            setMode(next)
            await storage.set("appearance_mode", next)
        },
        toggleOled: async () => {
            setOled(!oled)
            await storage.set("appearance_oled", String(!oled))
        },
        togglePointerLighting: async () => {
            setPointerLighting(!pointerLighting)
            await storage.set("appearance_pointer_lighting", String(!pointerLighting))
        }
    }
}

const MODES = [
    { id: "system" as const, label: "System", Icon: Monitor },
    { id: "light" as const, label: "Light", Icon: Sun },
    { id: "dark" as const, label: "Dark", Icon: Moon }
]

export function DefaultsSection({ hasAnyKey }: { hasAnyKey: boolean }) {
    const appearance = useAppearanceSettings()

    return (
        <>
            <SettingsSection title="Languages">
                <SettingsRow label="Translate to" hint="Default target for translations." htmlFor="default-translate-lang">
                    <LanguageSelect id="default-translate-lang" storageKey="default_lang_translate" defaultValue="English" />
                </SettingsRow>
                <SettingsRow label="Rewrite in" hint="Keep Original rewrites in the source language." htmlFor="default-rewrite-lang">
                    <LanguageSelect id="default-rewrite-lang" storageKey="default_lang_rewrite" defaultValue="Keep Original" />
                </SettingsRow>
                <SettingsRow label="Translation engine" hint={hasAnyKey ? "Google Translate is free and needs no key." : "Connect an AI provider to use it for translation."}>
                    <TranslationEngine hasAnyKey={hasAnyKey} />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Appearance">
                <SettingsRow label="Theme">
                    <SegmentedControl
                        ariaLabel="Theme"
                        value={appearance.mode}
                        onChange={appearance.selectMode}
                        options={MODES.map(({ id, label, Icon }) => ({
                            value: id,
                            label: <span className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-1.5"><Icon className="plasmo-h-3.5 plasmo-w-3.5" />{label}</span>
                        }))}
                    />
                </SettingsRow>
                <SettingsRow label="Pure black" hint="Use true black when the theme is dark." htmlFor="setting-oled">
                    <div className="plasmo-flex sm:plasmo-justify-end">
                        <Switch id="setting-oled" checked={appearance.oled} onChange={appearance.toggleOled} />
                    </div>
                </SettingsRow>
                <SettingsRow label="Pointer lighting" hint="Soft light that follows the pointer." htmlFor="setting-pointer">
                    <div className="plasmo-flex sm:plasmo-justify-end">
                        <Switch id="setting-pointer" checked={appearance.pointerLighting} onChange={appearance.togglePointerLighting} />
                    </div>
                </SettingsRow>
            </SettingsSection>
        </>
    )
}
