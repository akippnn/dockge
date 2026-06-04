import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "../log";
import { Settings } from "../settings";

export interface ExtensionManifest {
    name: string;
    version: string;
    description: string;
    permissions: string[];
    capabilities: {
        navLinks?: { path: string; icon: string; text: string }[];
        widgets?: { slot: string; component: string }[];
        hooks?: string[];
    };
}

export interface DockgeExtension {
    name: string;
    routes?: (router: any) => void;
    augmentStack?: (stack: any) => any;
    onStackAction?: (action: string, stackName: string, success: boolean) => void;
}

const extensionInfo: Map<string, { manifest: ExtensionManifest; backendPath: string | null }> = new Map();
const extensionBackends: Map<string, DockgeExtension> = new Map();

export function getExtensions(): Map<string, { manifest: ExtensionManifest; backendPath: string | null }> {
    return extensionInfo;
}

export async function isEnabled(name: string): Promise<boolean> {
    const val = await Settings.get(`ext_enabled_${name}`);
    return val === true || val === "true";
}

export async function setEnabled(name: string, enabled: boolean): Promise<void> {
    await Settings.set(`ext_enabled_${name}`, enabled ? "true" : "false", "extensions");
}

export async function getBackend(name: string): Promise<DockgeExtension | null> {
    if (extensionBackends.has(name)) return extensionBackends.get(name) || null;
    const info = extensionInfo.get(name);
    if (!info?.backendPath) return null;
    try {
        const extModule = await import(info.backendPath);
        const backend = extModule.default || extModule;
        extensionBackends.set(name, backend);
        return backend;
    } catch (e: any) {
        log.warn("extensions", `Failed to import backend for ${name}: ${e.message}`);
        return null;
    }
}

export function notifyExtensions(action: string, stackName: string, success: boolean): void {
    for (const [name, backend] of extensionBackends) {
        if (backend.onStackAction) {
            try { backend.onStackAction(action, stackName, success); } catch { /* ignore */ }
        }
    }
}

export function getManifests(): ExtensionManifest[] {
    const result: ExtensionManifest[] = [];
    for (const [_, ext] of extensionInfo) {
        result.push(ext.manifest);
    }
    return result;
}

export async function loadExtensions(): Promise<void> {
    const here = fileURLToPath(import.meta.url);
    const candidates = ["/app/extensions", path.join(path.dirname(here), "..", "..", "extensions")];
    let extDir = "";
    for (const c of candidates) {
        if (fs.existsSync(c)) { extDir = c; break; }
    }

    if (!extDir) {
        log.info("extensions", "No extensions directory found");
        return;
    }

    const dirs = fs.readdirSync(extDir, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;

        const metaPath = path.join(extDir, dir.name, "extension.json");
        if (!fs.existsSync(metaPath)) continue;

        try {
            const manifest: ExtensionManifest = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
            const backendPath = path.join(extDir, dir.name, "backend", "index.ts");
            const bp = fs.existsSync(backendPath) ? backendPath : null;

            extensionInfo.set(dir.name, { manifest, backendPath: bp });
            log.info("extensions", `Loaded extension: ${manifest.name} v${manifest.version}`);
        } catch (e: any) {
            log.warn("extensions", `Failed to load extension ${dir.name}: ${e.message}`);
        }
    }
}
