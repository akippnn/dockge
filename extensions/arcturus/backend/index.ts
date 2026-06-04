import { Router } from "express";
import { Settings } from "/app/backend/settings";
import * as runnerManager from "./runner-manager";

const SETTINGS_PREFIX = "extension-arcturus";

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
        // ─── Runner lifecycle ─────────────────────────────────
        router.post("/api/extensions/arcturus/runners/create", async (req, res) => {
            try {
                const { org } = req.body || {};
                if (!org || !["u128", "MProjects"].includes(org)) {
                    return res.status(400).json({ ok: false, msg: "org must be 'u128' or 'MProjects'" });
                }
                const runner = await runnerManager.createRunner(org);
                res.json({ ok: true, ...runner });
            } catch (e: any) {
                res.status(500).json({ ok: false, msg: e.message });
            }
        });

        router.delete("/api/extensions/arcturus/runners/:name", async (req, res) => {
            try {
                await runnerManager.deleteRunner(req.params.name);
                res.json({ ok: true });
            } catch (e: any) {
                res.status(500).json({ ok: false, msg: e.message });
            }
        });

        router.get("/api/extensions/arcturus/runners", async (_req, res) => {
            try {
                const runners = await runnerManager.listRunners();
                const anyBusy = runners.some((r: any) => r.state === "running" && r.status?.includes("busy"));
                res.json({ ok: true, runners, anyBusy });
            } catch (e: any) {
                res.status(500).json({ ok: false, msg: e.message });
            }
        });

        // ─── Deploy ───────────────────────────────────────────
        router.post("/api/extensions/arcturus/deploy", async (req, res) => {
            try {
                const deployUrl = (await Settings.get("arcturusDeployUrl", SETTINGS_PREFIX)) || "http://arcturus-deploy:8080";
                const { stack } = req.body || {};
                if (!stack) return res.status(400).json({ ok: false, msg: "stack is required" });
                const response = await fetch(`${deployUrl}/deploy?stack=${encodeURIComponent(stack)}`, { method: "POST" });
                const data = await response.json();
                res.json(data);
            } catch (e: any) {
                res.status(500).json({ ok: false, msg: e.message });
            }
        });

        // ─── Stacks ───────────────────────────────────────────
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
                    const protectPath = path.join(sp, ".dockge-protect");
                    const isProtected = fs.existsSync(protectPath);
                    let managedBy = "";
                    if (isProtected) {
                        try {
                            const data = JSON.parse(fs.readFileSync(protectPath, "utf-8"));
                            managedBy = data.managed_by || "";
                        } catch { /* ignore */ }
                    }
                    if (!hasCompose) continue;
                    let status = "unknown";
                    try {
                        const out = execSync(
                            `docker ps --filter "label=com.docker.compose.project=${entry.name}" --format "{{.Status}}"`,
                            { encoding: "utf-8", timeout: 5000 }
                        ).trim();
                        status = out.includes("Up") ? "running" : "stopped";
                    } catch { /* ignore */ }
                    stacks.push({ name: entry.name, status, dockgeProtect: isProtected, managedByArcturus: managedBy === "terraform" });
                }
                res.json({ stacks });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ─── Settings ─────────────────────────────────────────
        router.get("/api/extensions/arcturus/settings", async (_req, res) => {
            const deployUrl = (await Settings.get("arcturusDeployUrl", SETTINGS_PREFIX)) || "http://arcturus-deploy:8080";
            const giteaUrl = (await Settings.get("giteaUrl", SETTINGS_PREFIX)) || "http://gitea-tailscale:3000";
            const tokenSet = !!(await Settings.get("giteaToken", SETTINGS_PREFIX));
            res.json({ arcturusDeployUrl: deployUrl, giteaUrl, giteaTokenConfigured: tokenSet });
        });

        router.post("/api/extensions/arcturus/settings", async (req, res) => {
            try {
                const allowed = ["arcturusDeployUrl", "giteaToken", "giteaUrl"];
                for (const key of allowed) {
                    if (req.body[key] !== undefined) {
                        await Settings.set(key, req.body[key], SETTINGS_PREFIX);
                    }
                }
                res.json({ ok: true });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });
    },
};
