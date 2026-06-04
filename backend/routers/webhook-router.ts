import { DockgeServer } from "../dockge-server";
import { Router } from "../router";
import express, { Express, Router as ExpressRouter } from "express";
import { log } from "../log";

export class WebhookRouter extends Router {
    create(app: Express, server: DockgeServer): ExpressRouter {
        const router = express.Router();

        // Webhook secret from env
        const webhookSecret = process.env.WEBHOOK_SECRET || "";
        // Arcturus deploy service URL
        const deployUrl = process.env.ARCTURUS_DEPLOY_URL || "http://arcturus-deploy:8080";

        // JSON body parser
        router.use(express.json());

        // Auth middleware: all webhook routes require Bearer token
        router.use("/api/webhook", (req, res, next) => {
            if (!webhookSecret) {
                res.status(500).json({ error: "WEBHOOK_SECRET not configured" });
                return;
            }
            const auth = req.headers.authorization;
            if (!auth || !auth.startsWith("Bearer ")) {
                res.status(401).json({ error: "Missing or invalid Authorization header" });
                return;
            }
            const token = auth.slice(7);
            if (token !== webhookSecret) {
                res.status(401).json({ error: "Invalid webhook secret" });
                return;
            }
            next();
        });

        // POST /api/webhook/deploy — trigger terraform apply/destroy for a stack
        router.post("/api/webhook/deploy", async (req, res) => {
            try {
                const { stack, action = "apply" } = req.body;
                if (!stack) {
                    res.status(400).json({ error: "Missing 'stack' in request body" });
                    return;
                }
                log.info("webhook", `Deploy ${action} for stack ${stack}`);
                const response = await fetch(`${deployUrl}/deploy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${webhookSecret}` },
                    body: JSON.stringify({ stack, action }),
                });
                const data = await response.json();
                res.status(response.status).json(data);
            } catch (e: any) {
                log.error("webhook", `Deploy error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // GET /api/webhook/deploy/status/:stack — check deployment status
        router.get("/api/webhook/deploy/status/:stack", async (req, res) => {
            try {
                const response = await fetch(`${deployUrl}/status/${req.params.stack}`, {
                    headers: { "Authorization": `Bearer ${webhookSecret}` },
                });
                const data = await response.json();
                res.status(response.status).json(data);
            } catch (e: any) {
                log.error("webhook", `Status error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // POST /api/webhook/service/tcp — register a TCP service
        router.post("/api/webhook/service/tcp", async (req, res) => {
            try {
                const response = await fetch(`${deployUrl}/tcp-service`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${webhookSecret}` },
                    body: JSON.stringify(req.body),
                });
                const data = await response.json();
                res.status(response.status).json(data);
            } catch (e: any) {
                log.error("webhook", `TCP service error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // POST /api/webhook/dns — update a DNS record
        router.post("/api/webhook/dns", async (req, res) => {
            try {
                const response = await fetch(`${deployUrl}/dns`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${webhookSecret}` },
                    body: JSON.stringify(req.body),
                });
                const data = await response.json();
                res.status(response.status).json(data);
            } catch (e: any) {
                log.error("webhook", `DNS error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        // POST /api/webhook/notify/discord — send a Discord notification
        router.post("/api/webhook/notify/discord", async (req, res) => {
            try {
                const response = await fetch(`${deployUrl}/notify/discord`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${webhookSecret}` },
                    body: JSON.stringify(req.body),
                });
                const data = await response.json();
                res.status(response.status).json(data);
            } catch (e: any) {
                log.error("webhook", `Discord notify error: ${e.message}`);
                res.status(502).json({ error: `Deploy service unreachable: ${e.message}` });
            }
        });

        return router;
    }
}
