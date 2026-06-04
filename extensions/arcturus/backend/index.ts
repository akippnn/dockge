import { Router } from "express";
import { probeRunners, anyRunnerBusy } from "./runner-probe";
import { triggerDeploy } from "./deploy-client";
import { Settings } from "/app/backend/settings";

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

        // GET /api/extensions/arcturus/settings — current config (no secrets)
        router.get("/api/extensions/arcturus/settings", async (req, res) => {
            const deployUrl = await Settings.get("arcturusDeployUrl") || "http://arcturus-deploy:8080";
            const giteaUrl = await Settings.get("giteaUrl") || "http://gitea-tailscale:3000";
            const tokenSet = !!(await Settings.get("giteaToken"));
            res.json({ arcturusDeployUrl: deployUrl, giteaUrl, giteaTokenConfigured: tokenSet });
        });

        // POST /api/extensions/arcturus/settings — update config
        router.post("/api/extensions/arcturus/settings", async (req, res) => {
            try {
                const allowed = ["arcturusDeployUrl", "giteaToken", "giteaUrl"];
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
