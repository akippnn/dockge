import * as fs from "node:fs";
import * as path from "node:path";
import { generateLabel, releaseLabel } from "./label-gen";
import { generateRunnerToken } from "./gitea-client";
import {
    createContainer,
    connectNetwork,
    startContainer,
    stopContainer,
    removeContainer,
    listContainers,
    inspectContainer,
} from "./docker-util";

const RUNNER_LABEL_PREFIX = "u128.arcturus.runner";
const RUNNER_IMAGE = "gitea/act_runner:latest";
const CONFIG_DIR = "/home/akippnn/stacks/.runner-data";

function runnerName(org: string, label: string): string {
    return `arcturus-runner-${org}-${label}`;
}

function containerLabels(org: string, label: string): Record<string, string> {
    return {
        [RUNNER_LABEL_PREFIX]: "true",
        "u128.arcturus.runner.org": org,
        "u128.arcturus.runner.label": label,
    };
}

function generateConfigYaml(giteaUrl: string, network: string, labels: string): string {
    const labelLines = labels.split(",").map(l => `      - "${l.trim()}"`).join("\n");
    return `log:
  level: info

runner:
  file: .runner
  capacity: 1
  envs:
    DOCKER_HOST: unix:///var/run/docker.sock
  timeout: 3h
  fetch_timeout: 5s
  fetch_interval: 2s
  labels:
${labelLines}

container:
  network: "${network}"
  privileged: true
  options: "--security-opt label=disable"
  valid_volumes: ["**", "/var/run/docker.sock", "/run/user/1001/podman/podman.sock"]
  docker_host: "-"

cache:
  enabled: true
`;
}

export async function createRunner(
    org: string,
    opts: {
        giteaUrl?: string;
        giteaAdminToken?: string;
        giteaContainer?: string;
        network?: string;
        labels?: string;
    } = {}
): Promise<{ name: string; label: string }> {
    if (!org || typeof org !== "string" || !org.trim()) {
        throw new Error("Organization name is required");
    }
    const label = generateLabel();
    const giteaUrl = opts.giteaUrl || "http://gitea-tailscale:3000";
    const network = opts.network || "internal_routing";
    const labels = opts.labels || "ubuntu-latest:docker://docker.gitea.com/runner-images:ubuntu-latest";

    const token = await generateRunnerToken(giteaUrl, opts.giteaAdminToken || "", org, opts.giteaContainer);
    const name = runnerName(org, label);
    const dataDir = path.join(CONFIG_DIR, name);

    // Write config.yaml to a host path that can be bind-mounted into the runner
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, "config.yaml"), generateConfigYaml(giteaUrl, network, labels), "utf-8");

    const config = {
        Image: RUNNER_IMAGE,
        Entrypoint: [
            "/bin/sh", "-c",
            "chmod 666 /var/run/docker.sock && cd /data && exec /usr/local/bin/run.sh",
        ],
        Cmd: [],
        Env: [
            `GITEA_INSTANCE_URL=${giteaUrl}`,
            `GITEA_RUNNER_REGISTRATION_TOKEN=${token}`,
            `GITEA_RUNNER_NAME=${label}`,
            `GITEA_RUNNER_LABELS=${labels}`,
            "DOCKER_HOST=unix:///var/run/docker.sock",
        ],
        HostConfig: {
            Binds: [
                "/run/user/1001/podman/podman.sock:/var/run/docker.sock",
                `${dataDir}:/data`,
            ],
            RestartPolicy: { Name: "always" },
            SecurityOpt: ["label=disable"],
        },
        Labels: containerLabels(org, label),
    };

    await createContainer(name, config);
    await connectNetwork(name, network);
    await startContainer(name);

    return { name, label };
}

export async function deleteRunner(name: string): Promise<void> {
    const info = await inspectContainer(name);
    if (!info) throw new Error(`Runner container "${name}" not found`);

    const labels = info.Config?.Labels || {};
    const label = labels["u128.arcturus.runner.label"];
    if (label) releaseLabel(label);

    await stopContainer(name);
    await removeContainer(name);

    // Clean up config data directory
    const dataDir = path.join(CONFIG_DIR, name);
    try { fs.rmSync(dataDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

export async function listRunners(): Promise<any[]> {
    const containers = await listContainers(`${RUNNER_LABEL_PREFIX}=true`);
    return containers.map((c: any) => {
        const names = c.Names || [];
        const labels = c.Labels || {};
        return {
            id: c.Id?.slice(0, 12),
            name: (names[0] || "").replace(/^\//, ""),
            org: labels["u128.arcturus.runner.org"] || "",
            label: labels["u128.arcturus.runner.label"] || "",
            state: c.State,
            status: c.Status,
            created: c.Created,
        };
    });
}
