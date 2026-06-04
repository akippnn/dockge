import { Router } from "express";
import { Settings } from "/app/backend/settings";

const COLORS: Record<string, number> = {
    info: 0x3498DB, success: 0x2ECC71, warn: 0xF1C40F, error: 0xE74C3C,
};

async function sendDiscord(title: string, level: string = "info") {
    const url = await Settings.get("discordWebhookUrl") || "";
    if (!url) return;
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [{ title, color: COLORS[level] || COLORS.info, timestamp: new Date().toISOString() }],
            }),
        });
    } catch { /* ignore */ }
}

export default {
    name: "discord",

    routes(router: Router) {
        router.get("/api/extensions/discord/settings", async (_req, res) => {
            const url = await Settings.get("discordWebhookUrl") || "";
            res.json({ webhookUrl: url });
        });
        router.post("/api/extensions/discord/settings", async (req, res) => {
            if (req.body.webhookUrl !== undefined) {
                await Settings.set("discordWebhookUrl", req.body.webhookUrl, "extension-discord");
            }
            res.json({ ok: true });
        });
    },

    onStackAction(action: string, stackName: string, success: boolean) {
        const icons: Record<string, string> = {
            deploy: success ? "✅" : "❌",
            delete: success ? "🗑️" : "❌",
            start: success ? "▶️" : "❌",
            stop: success ? "⏹️" : "❌",
            restart: success ? "🔄" : "❌",
        };
        const icon = icons[action] || "";
        sendDiscord(`Stack **${stackName}**: ${action} ${icon}`, success ? "info" : "error");
    },
};
