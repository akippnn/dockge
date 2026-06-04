import { DockgeServer } from "../dockge-server";
import { Router } from "../router";
import express, { Express, Router as ExpressRouter } from "express";
import { log } from "../log";
import { Settings } from "../settings";

export class WebhookRouter extends Router {
    async resolve(key: string, envName: string, defaultValue: string): Promise<string> {
        const db = await Settings.get(key);
        if (db !== null && db !== undefined) return String(db);
        return process.env[envName] || defaultValue;
    }

    async headers(): Promise<Record<string, string>> {
        const secret = await this.resolve("webhookSecret", "WEBHOOK_SECRET", "");
        return { "Content-Type": "application/json", "Authorization": `Bearer ${secret}` };
    }

    create(app: Express, server: DockgeServer): ExpressRouter {
        const router = express.Router();
        router.use(express.json());

        // Auth middleware
        router.use("/api/webhook", async (req, res, next) => {
            const secret = await this.resolve("webhookSecret", "WEBHOOK_SECRET", "");
            if (!secret) {
                res.status(500).json({ error: "Webhook secret not configured. Set via POST /api/webhook/settings or WEBHOOK_SECRET env var." });
                return;
            }
            const auth = req.headers.authorization;
            if (!auth || !auth.startsWith("Bearer ")) {
                res.status(401).json({ error: "Missing or invalid Authorization header" });
                return;
            }
            if (auth.slice(7) !== secret) {
                res.status(401).json({ error: "Invalid webhook secret" });
                return;
            }
            next();
        });

        // GET /api/webhook/settings
        router.get("/api/webhook/settings", async (req, res) => {
            const secret = await this.resolve("webhookSecret", "WEBHOOK_SECRET", "");
            const discordUrl = await this.resolve("discordWebhookUrl", "DISCORD_WEBHOOK_URL", "");
            const deployUrl = await this.resolve("arcturusDeployUrl", "ARCTURUS_DEPLOY_URL", "http://arcturus-deploy:8080");
            res.json({
                webhook_secret_configured: !!secret,
                discord_configured: !!discordUrl,
                arcturus_deploy_url: deployUrl,
                endpoints: [
                    { method: "POST", path: "/api/webhook/deploy", description: "Trigger terraform apply/destroy" },
                    { method: "GET", path: "/api/webhook/deploy/status/:stack", description: "Check deployment status" },
                    { method: "POST", path: "/api/webhook/service/tcp", description: "Register a TCP service" },
                    { method: "POST", path: "/api/webhook/dns", description: "Update a DNS record" },
                    { method: "POST", path: "/api/webhook/notify/discord", description: "Send a Discord notification" },
                    { method: "GET", path: "/api/webhook/settings", description: "This page" },
                ],
            });
        });

        // POST /api/webhook/settings
        router.post("/api/webhook/settings", async (req, res) => {
            try {
                const secret = await this.resolve("webhookSecret", "WEBHOOK_SECRET", "");
                const auth = req.headers.authorization;
                if (auth && auth.startsWith("Bearer ") && auth.slice(7) === secret) {
                    const allowed = ["webhookSecret", "discordWebhookUrl", "arcturusDeployUrl"];
                    for (const key of allowed) {
                        if (req.body[key] !== undefined) {
                            await Settings.set(key, req.body[key], "webhook");
                        }
                    }
                    res.json({ ok: true, msg: "Settings saved" });
                    return;
                }
                res.status(401).json({ error: "Unauthorized" });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // POST /api/webhook/deploy
        router.post("/api/webhook/deploy", async (req, res) => {
            try {
                const { stack, action = "apply" } = req.body;
                if (!stack) { res.status(400).json({ error: "Missing 'stack'" }); return; }
                const deployUrl = await this.resolve("arcturusDeployUrl", "ARCTURUS_DEPLOY_URL", "http://arcturus-deploy:8080");
                log.info("webhook", `Deploy ${action} for stack ${stack}`);
                const response = await fetch(`${deployUrl}/deploy`, {
                    method: "POST", headers: await this.headers(),
                    body: JSON.stringify({ stack, action }),
                });
                res.status(response.status).json(await response.json());
            } catch (e: any) {
                log.error("webhook", `Deploy error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // GET /api/webhook/deploy/status/:stack
        router.get("/api/webhook/deploy/status/:stack", async (req, res) => {
            try {
                const deployUrl = await this.resolve("arcturusDeployUrl", "ARCTURUS_DEPLOY_URL", "http://arcturus-deploy:8080");
                const response = await fetch(`${deployUrl}/status/${req.params.stack}`, { headers: await this.headers() });
                res.status(response.status).json(await response.json());
            } catch (e: any) {
                log.error("webhook", `Status error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // POST /api/webhook/service/tcp
        router.post("/api/webhook/service/tcp", async (req, res) => {
            try {
                const deployUrl = await this.resolve("arcturusDeployUrl", "ARCTURUS_DEPLOY_URL", "http://arcturus-deploy:8080");
                const response = await fetch(`${deployUrl}/tcp-service`, {
                    method: "POST", headers: await this.headers(), body: JSON.stringify(req.body),
                });
                res.status(response.status).json(await response.json());
            } catch (e: any) {
                log.error("webhook", `TCP service error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // POST /api/webhook/dns
        router.post("/api/webhook/dns", async (req, res) => {
            try {
                const deployUrl = await this.resolve("arcturusDeployUrl", "ARCTURUS_DEPLOY_URL", "http://arcturus-deploy:8080");
                const response = await fetch(`${deployUrl}/dns`, {
                    method: "POST", headers: await this.headers(), body: JSON.stringify(req.body),
                });
                res.status(response.status).json(await response.json());
            } catch (e: any) {
                log.error("webhook", `DNS error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // POST /api/webhook/notify/discord
        router.post("/api/webhook/notify/discord", async (req, res) => {
            try {
                const deployUrl = await this.resolve("arcturusDeployUrl", "ARCTURUS_DEPLOY_URL", "http://arcturus-deploy:8080");
                const response = await fetch(`${deployUrl}/notify/discord`, {
                    method: "POST", headers: await this.headers(), body: JSON.stringify(req.body),
                });
                res.status(response.status).json(await response.json());
            } catch (e: any) {
                log.error("webhook", `Discord notify error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        return router;
    }
}
