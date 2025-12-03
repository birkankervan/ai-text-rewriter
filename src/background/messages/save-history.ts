import type { PlasmoMessaging } from "@plasmohq/messaging"
import { historyService, type HistoryItem } from "~services/history"

const handler: PlasmoMessaging.MessageHandler<HistoryItem> = async (req, res) => {
    try {
        await historyService.add(req.body)
        res.send({ success: true })
    } catch (error) {
        console.error("Failed to save history:", error)
        res.send({ success: false, error: error.message })
    }
}

export default handler
