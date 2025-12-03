import type { PlasmoMessaging } from "@plasmohq/messaging"

/**
 * Free Google Translate Handler
 * Uses direct API call instead of library (library doesn't work in Service Worker)
 */
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
    try {
        const { text, to } = req.body

        if (!text || !to) {
            console.error("❌ Background: Missing parameters", { text: !!text, to: !!to })
            return res.send({
                error: "Missing required parameters: text and to"
            })
        }

        // Use Google Translate unofficial API
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`

        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.statusText}`)
        }

        const data = await response.json()

        // Parse response: data[0] is array of translations
        // Each item is [translated_text, original_text]
        let translatedText = ""
        if (data && data[0]) {
            translatedText = data[0].map((item: any) => item[0]).join("")
        }

        res.send({
            success: true,
            translatedText: translatedText || text
        })
    } catch (error) {
        console.error("💥 Background: Free translation error:", error)
        res.send({
            error: error.message || "Translation failed"
        })
    }
}

export default handler
