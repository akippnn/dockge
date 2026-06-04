import { Router } from "express";
import { probeRunners, anyRunnerBusy } from "./runner-probe";
import { triggerDeploy } from "./deploy-client";
import { Settings } from "/app/backend/settings";

const DISCORD_COLORS: Record<string, number> = {
    info: 0x3498DB, success: 0x2ECC71, warn: 0xF1C40F, error: 0xE74C3C,
};

async function sendDiscordNotification(message: string, level: string = "info") {
    const url = await Settings.get("discordWebhookUrl") || "";
    if (!url) return;
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [{ title: message, color: DISCORD_COLORS[level] || DISCORD_COLORS.info, timestamp: new Date().toISOString() }],
            }),
        });
    } catch { /* ignore */ }
}

const EXT_SETTINGS_TYPE = "extension-arcturus";

export default {
    name: "arcturus",

    // Show "Arcturus" badge on protected stacks
    augmentStack(stack: any): any {
        if (stack.isProtected) {
            return { ...stack, managedByArcturus: true };
        }
        return stack;
    },

    // Send Discord notifications on stack lifecycle events
    onStackAction(action: string, stackName: string, success: boolean) {
        const icons: Record<string, string> = {
            deploy: success ? "✅" : "❌",
            delete: success ? "🗑️" : "❌",
            start: success ? "▶️" : "❌",
            stop: success ? "⏹️" : "❌",
            restart: success ? "🔄" : "❌",
        };
        const icon = icons[action] || "";
        const msg = `Stack **${stackName}**: ${action} ${icon}`;
        sendDiscordNotification(msg, success ? "info" : "error");
    },

    // Settings schema (rendered automatically by ExtensionSlot)
    settings: {
        arcturusDeployUrl: {
            label: "Arcturus Deploy URL",
            default: "http://arcturus-deploy:8080",
        },
        giteaToken: {
            label: "Gitea API Token",
            type: "password",
            default: "",
        },
        giteaUrl: {
            label: "Gitea URL",
            default: "http://gitea-tailscale:3000",
        },
    },

    // Express routes for the extension
    routes(router: Router) {
        // GET /api/extensions/arcturus/runners — runner status
        router.get("/api/extensions/arcturus/runners", async (req, res) => {
            try {
                const giteaUrl = await Settings.get("giteaUrl") || "http://gitea-tailscale:3000";
                const giteaToken = await Settings.get("giteaToken") || "";
                const runners = await probeRunners(giteaUrl, giteaToken);
                res.json({ runners, anyBusy: anyRunnerBusy(runners) });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // POST /api/extensions/arcturus/deploy — trigger a deploy
        router.post("/api/extensions/arcturus/deploy", async (req, res) => {
            try {
                const deployUrl = await Settings.get("arcturusDeployUrl") || "http://arcturus-deploy:8080";
                const { stack, action = "apply", domain = "" } = req.body;
                if (!stack) {
                    res.status(400).json({ error: "Missing 'stack'" });
                    return;
                }
                const result = await triggerDeploy(deployUrl, stack, action, domain);
                res.json(result);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // GET /api/extensions/arcturus/stacks — list managed stacks with status
        router.get("/api/extensions/arcturus/stacks", async (req, res) => {
            try {
                const stacksDir = process.env.DOCKGE_STACKS_DIR || "/home/akippnn/stacks";
                const fs = await import("node:fs");
                const path = await import("node:path");
                const entries = fs.readdirSync(stacksDir, { withFileTypes: true });
                const stacks = [];
                for (const entry of entries) {
                    if (!entry.isDirectory()) continue;
                    const stackPath = path.join(stacksDir, entry.name);
                    const composeFile = path.join(stackPath, "compose.yaml");
                    const dockgeProtect = path.join(stackPath, ".dockge-protect");
                    const hasCompose = fs.existsSync(composeFile);
                    const isProtected = fs.existsSync(dockgeProtect);
                    if (!hasCompose) continue;
                    // Check if containers are running
                    let status = "unknown";
                    try {
                        const { execSync } = await import("node:child_process");
                        const output = execSync(
                            `docker ps --filter "label=com.docker.compose.project=${entry.name}" --format "{{.Status}}"`,
                            { encoding: "utf-8", timeout: 5000 }
                        ).trim();
                        status = output.includes("Up") ? "running" : "stopped";
                    } catch { /* ignore */ }
                    stacks.push({ name: entry.name, status, dockgeProtect: isProtected, managedByArcturus: isProtected });
                }
                res.json({ stacks });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // GET /api/extensions/arcturus/settings — current config (no secrets)
        router.get("/api/extensions/arcturus/settings", async (req, res) => {
            const deployUrl = await Settings.get("arcturusDeployUrl") || "http://arcturus-deploy:8080";
            const giteaUrl = await Settings.get("giteaUrl") || "http://gitea-tailscale:3000";
            const discordUrl = await Settings.get("discordWebhookUrl") || "";
            const tokenSet = !!(await Settings.get("giteaToken"));
            res.json({ arcturusDeployUrl: deployUrl, giteaUrl, discordWebhookUrl: discordUrl, giteaTokenConfigured: tokenSet });
        });

        // POST /api/extensions/arcturus/settings — update config
        router.post("/api/extensions/arcturus/settings", async (req, res) => {
            try {
                const allowed = ["arcturusDeployUrl", "giteaToken", "giteaUrl", "discordWebhookUrl"];
                for (const key of allowed) {
                    if (req.body[key] !== undefined) {
                        await Settings.set(key, req.body[key], EXT_SETTINGS_TYPE);
                    }
                }
                res.json({ ok: true });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });
    },
};
