import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"

export type AppearanceMode = "system" | "light" | "dark"

const storage = new Storage()

export function useAppearance() {
    const [mode, setMode] = useState<AppearanceMode>("system")
    const [oled, setOled] = useState(false)
    const [pointerLighting, setPointerLighting] = useState(true)
    const [systemDark, setSystemDark] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches)

    useEffect(() => {
        const media = matchMedia("(prefers-color-scheme: dark)")
        const load = async () => {
            const [savedMode, savedOled, savedPointerLighting] = await Promise.all([
                storage.get("appearance_mode"),
                storage.get("appearance_oled"),
                storage.get("appearance_pointer_lighting")
            ])
            if (["system", "light", "dark"].includes(savedMode)) setMode(savedMode as AppearanceMode)
            setOled(savedOled === "true" || (savedOled as unknown) === true)
            setPointerLighting(savedPointerLighting !== "false" && (savedPointerLighting as unknown) !== false)
        }
        const onMediaChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
        // storage.watch parses Plasmo's JSON-encoded values; raw chrome.storage.onChanged does not
        const watchers = {
            appearance_mode: (c: { newValue?: unknown }) => {
                if (["system", "light", "dark"].includes(c.newValue as string)) setMode(c.newValue as AppearanceMode)
            },
            appearance_oled: (c: { newValue?: unknown }) => setOled(c.newValue === "true" || c.newValue === true),
            appearance_pointer_lighting: (c: { newValue?: unknown }) => setPointerLighting(c.newValue !== "false" && c.newValue !== false)
        }

        load()
        media.addEventListener("change", onMediaChange)
        storage.watch(watchers)
        return () => {
            media.removeEventListener("change", onMediaChange)
            storage.unwatch(watchers)
        }
    }, [])

    const isDark = mode === "dark" || (mode === "system" && systemDark)
    return {
        mode,
        oled,
        pointerLighting,
        isDark,
        className: `${isDark ? "appearance-dark" : "appearance-light"}${isDark && oled ? " appearance-oled" : ""}`
    }
}
