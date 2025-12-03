// Setup automatic history cleanup (15 days)
const ALARM_NAME = "history-cleanup"
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000

// Create the alarm if it doesn't exist
chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm) {
        chrome.alarms.create(ALARM_NAME, {
            periodInMinutes: 24 * 60 // Run once a day
        })
    }
})

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        console.log("Running scheduled history cleanup...")
        try {
            const { historyService } = await import("~services/history")
            const count = await historyService.deleteOlderThan(FIFTEEN_DAYS_MS)
            if (count > 0) {
                console.log(`✅ Cleanup complete. Deleted ${count} old history items.`)
            }
        } catch (error) {
            console.error("❌ Failed to cleanup history:", error)
        }
    }
})

// Run cleanup on extension install/update
const runStartupCleanup = async () => {
    console.log("Running startup history cleanup...")
    try {
        const { historyService } = await import("~services/history")
        const count = await historyService.deleteOlderThan(FIFTEEN_DAYS_MS)
        if (count > 0) {
            console.log(`✅ Startup cleanup complete. Deleted ${count} old history items.`)
        }
    } catch (error) {
        console.error("❌ Failed to run startup cleanup:", error)
    }
}

chrome.runtime.onInstalled.addListener(runStartupCleanup)
chrome.runtime.onStartup.addListener(runStartupCleanup)

export { }
