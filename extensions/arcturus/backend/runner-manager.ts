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

interface RunnerConfig {
    org: string;
    label: string;
}

const RUNNER_LABEL_PREFIX = "u128.arcturus.runner";
const RUNNER_IMAGE = "gitea/act_runner:latest";
const GITEA_URL = "http://gitea-tailscale:3000";
const NETWORK = "internal_routing";

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

export async function createRunner(org: string): Promise<{ name: string; label: string }> {
    const label = generateLabel();
    const token = generateRunnerToken(org);
    const name = runnerName(org, label);

    const config = {
        Image: RUNNER_IMAGE,
        Entrypoint: [
            "/bin/sh", "-c",
            "chmod 666 /var/run/docker.sock && cd /data && exec /usr/local/bin/run.sh",
        ],
        Cmd: [],
        Env: [
            `GITEA_INSTANCE_URL=${GITEA_URL}`,
            `GITEA_RUNNER_REGISTRATION_TOKEN=${token}`,
            `GITEA_RUNNER_NAME=${label}`,
            `GITEA_RUNNER_LABELS=ubuntu-latest:docker://docker.gitea.com/runner-images:ubuntu-latest`,
            `DOCKER_HOST=unix:///var/run/docker.sock`,
        ],
        HostConfig: {
            Binds: [
                "/run/user/1001/podman/podman.sock:/var/run/docker.sock",
            ],
            RestartPolicy: { Name: "always" },
            SecurityOpt: ["label=disable"],
        },
        Labels: containerLabels(org, label),
    };

    await createContainer(name, config);
    await connectNetwork(name, NETWORK);
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

export async function getRunnerStatus(name: string): Promise<any> {
    const info = await inspectContainer(name);
    if (!info) return null;
    const labels = info.Config?.Labels || {};
    const env = info.Config?.Env || [];
    return {
        name,
        org: labels["u128.arcturus.runner.org"] || "",
        label: labels["u128.arcturus.runner.label"] || "",
        state: info.State?.Status,
        running: info.State?.Running,
        started: info.State?.StartedAt,
    };
}
