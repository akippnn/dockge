import http from "http";
import { execSync } from "child_process";

const socketPath = "/var/run/docker.sock";

export interface DockerContainer {
    Id: string;
    Names: string[];
    State: string;
    Status: string;
    Labels: Record<string, string>;
}

export function dockerRequest(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
        const opts: http.RequestOptions = {
            socketPath,
            method,
            path,
            headers: { "Content-Type": "application/json" },
        };
        const req = http.request(opts, (res) => {
            let raw = "";
            res.on("data", (chunk) => (raw += chunk.toString()));
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode || 0, data: JSON.parse(raw) });
                } catch {
                    resolve({ status: res.statusCode || 0, data: raw });
                }
            });
        });
        req.on("error", reject);
        if (body !== undefined) req.write(JSON.stringify(body));
        req.end();
    });
}

export function dockerExec(container: string, command: string): string {
    const fullCmd = `docker exec ${container} sh -c ${JSON.stringify(command)}`;
    return execSync(fullCmd, { encoding: "utf-8", timeout: 10000 });
}

export async function listContainers(label?: string): Promise<DockerContainer[]> {
    const filters: any = {};
    if (label) filters.label = [label];
    const qs = label ? `?filters=${encodeURIComponent(JSON.stringify(filters))}` : "";
    const { data } = await dockerRequest("GET", `/containers/json${qs}`);
    return data || [];
}

export async function containerExists(name: string): Promise<boolean> {
    const { status } = await dockerRequest("GET", `/containers/${name}/json`);
    return status === 200;
}

export async function createContainer(name: string, config: any): Promise<void> {
    const { status, data } = await dockerRequest("POST", `/containers/create?name=${encodeURIComponent(name)}`, config);
    if (status !== 201) throw new Error(`Failed to create container: ${JSON.stringify(data)}`);
}

export async function connectNetwork(container: string, network: string): Promise<void> {
    const { status, data } = await dockerRequest("POST", `/networks/${encodeURIComponent(network)}/connect`, {
        Container: container,
    });
    if (status !== 200) throw new Error(`Failed to connect to network ${network}: ${JSON.stringify(data)}`);
}

export async function startContainer(name: string): Promise<void> {
    const { status, data } = await dockerRequest("POST", `/containers/${encodeURIComponent(name)}/start`);
    if (status !== 204 && status !== 304) throw new Error(`Failed to start container: ${JSON.stringify(data)}`);
}

export async function stopContainer(name: string): Promise<void> {
    await dockerRequest("POST", `/containers/${encodeURIComponent(name)}/stop`);
}

export async function removeContainer(name: string): Promise<void> {
    await dockerRequest("DELETE", `/containers/${encodeURIComponent(name)}?force=true`);
}

export async function inspectContainer(name: string): Promise<any> {
    const { status, data } = await dockerRequest("GET", `/containers/${encodeURIComponent(name)}/json`);
    if (status !== 200) return null;
    return data;
}
