import { log } from "./log";

const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

const colors: Record<string, number> = {
    info: 0x3498DB,
    success: 0x2ECC71,
    warn: 0xF1C40F,
    error: 0xE74C3C,
};

export async function sendDiscordNotification(title: string, level: string = "info") {
    if (!discordWebhookUrl) {
        log.debug("notify", "Discord webhook URL not set, skipping notification");
        return;
    }

    const color = colors[level] || colors.info;

    const payload = {
        embeds: [{
            title,
            color,
            timestamp: new Date().toISOString(),
        }],
    };

    try {
        const response = await fetch(discordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            log.warn("notify", `Discord webhook returned ${response.status}`);
        }
    } catch (e: any) {
        log.warn("notify", `Failed to send Discord notification: ${e.message}`);
    }
}
