import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "../log";

export interface DockgeExtension {
    name: string;
    routes?: (router: any) => void;
    augmentStack?: (stack: any) => any;
    settings?: Record<string, { label: string; type?: string; default?: string }>;
    // Lifecycle hooks — called after stack actions complete
    onStackAction?: (action: string, stackName: string, success: boolean) => void;
}

const loadedExtensions: Map<string, DockgeExtension> = new Map();

export function getExtensions(): Map<string, DockgeExtension> {
    return loadedExtensions;
}

/** Notify all loaded extensions of a stack action */
export function notifyExtensions(action: string, stackName: string, success: boolean): void {
    for (const [_, ext] of loadedExtensions) {
        if (ext.onStackAction) {
            try {
                ext.onStackAction(action, stackName, success);
            } catch { /* ignore extension errors */ }
        }
    }
}

export async function loadExtensions(): Promise<void> {
    const here = fileURLToPath(import.meta.url);
    // Extensions are at /app/extensions/ in the container
    const candidates = ["/app/extensions", path.join(path.dirname(here), "..", "..", "extensions")];
    let extDir = "";
    for (const c of candidates) {
        if (fs.existsSync(c)) { extDir = c; break; }
    }

    if (!extDir) {
        log.info("extensions", "No extensions directory found, skipping");
        return;
    }

    const dirs = fs.readdirSync(extDir, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;

        const metaPath = path.join(extDir, dir.name, "extension.json");
        if (!fs.existsSync(metaPath)) continue;

        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
            const backendPath = path.join(extDir, dir.name, "backend", "index.ts");
            if (fs.existsSync(backendPath)) {
                // tsx handles .ts imports natively
                const extModule = await import(backendPath);
                const ext = extModule.default || extModule;
                loadedExtensions.set(dir.name, ext);
                log.info("extensions", `Loaded extension: ${meta.name} v${meta.version}`);
            }
        } catch (e: any) {
            log.warn("extensions", `Failed to load extension ${dir.name}: ${e.message}`);
        }
    }
}
