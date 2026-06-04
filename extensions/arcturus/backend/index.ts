import { Router } from "express";
import { probeRunners } from "./runner-probe";
import { triggerDeploy } from "./deploy-client";
import { Settings } from "/app/backend/settings";

export default {
    name: "arcturus",

    augmentStack(stack: any): any {
        if (stack.isProtected && stack.managedBy === "terraform") {
            return { ...stack, managedByArcturus: true };
        }
        if (stack.isProtected) {
            return { ...stack, managedByArcturus: false };
        }
        return stack;
    },

    routes(router: Router) {
        router.get("/api/extensions/arcturus/runners", async (_req, res) => {
            try {
                const giteaUrl = await Settings.get("giteaUrl") || "http://gitea-tailscale:3000";
                const giteaToken = await Settings.get("giteaToken") || "";
                const runners = await probeRunners(giteaUrl, giteaToken);
                res.json({ runners, anyBusy: runners.some((r: any) => r.busy) });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        router.post("/api/extensions/arcturus/deploy", async (req, res) => {
            try {
                const deployUrl = await Settings.get("arcturusDeployUrl") || "http://arcturus-deploy:8080";
                const { stack, action = "apply", domain = "" } = req.body;
                if (!stack) { res.status(400).json({ error: "Missing 'stack'" }); return; }
                const result = await triggerDeploy(deployUrl, stack, action, domain);
                res.json(result);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        router.get("/api/extensions/arcturus/stacks", async (_req, res) => {
            try {
                const stacksDir = process.env.DOCKGE_STACKS_DIR || "/home/akippnn/stacks";
                const fs = await import("node:fs");
                const path = await import("node:path");
                const { execSync } = await import("node:child_process");
                const entries = fs.readdirSync(stacksDir, { withFileTypes: true });
                const stacks = [];
                for (const entry of entries) {
                    if (!entry.isDirectory()) continue;
                    const sp = path.join(stacksDir, entry.name);
                    const hasCompose = fs.existsSync(path.join(sp, "compose.yaml"));
                    const isProtected = fs.existsSync(path.join(sp, ".dockge-protect"));
                    if (!hasCompose) continue;
                    let status = "unknown";
                    try {
                        const out = execSync(
                            `docker ps --filter "label=com.docker.compose.project=${entry.name}" --format "{{.Status}}"`,
                            { encoding: "utf-8", timeout: 5000 }
                        ).trim();
                        status = out.includes("Up") ? "running" : "stopped";
                    } catch { /* ignore */ }
                    stacks.push({ name: entry.name, status, dockgeProtect: isProtected, managedByArcturus: isProtected });
                }
                res.json({ stacks });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        router.get("/api/extensions/arcturus/settings", async (_req, res) => {
            const deployUrl = await Settings.get("arcturusDeployUrl") || "http://arcturus-deploy:8080";
            const giteaUrl = await Settings.get("giteaUrl") || "http://gitea-tailscale:3000";
            const tokenSet = !!(await Settings.get("giteaToken"));
            res.json({ arcturusDeployUrl: deployUrl, giteaUrl, giteaTokenConfigured: tokenSet });
        });

        router.post("/api/extensions/arcturus/settings", async (req, res) => {
            try {
                const allowed = ["arcturusDeployUrl", "giteaToken", "giteaUrl"];
                for (const key of allowed) {
                    if (req.body[key] !== undefined) {
                        await Settings.set(key, req.body[key], "extension-arcturus");
                    }
                }
                res.json({ ok: true });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });
    },
};
