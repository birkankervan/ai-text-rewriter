import type { PlasmoMessaging } from "@plasmohq/messaging"
import { historyService, type HistoryItem } from "~services/history"

interface RequestBody {
    type: HistoryItem["type"]
    limit: number
}

const handler: PlasmoMessaging.MessageHandler<RequestBody> = async (req, res) => {
    try {
        const items = await historyService.getRecent(req.body.type, req.body.limit)
        res.send({ success: true, items })
    } catch (error) {
        console.error("Failed to load recent history:", error)
        res.send({ success: false, error: error instanceof Error ? error.message : "Failed to load recent history" })
    }
}

export default handler
