import { dockerExec } from "./docker-util";

export async function generateRunnerToken(
    giteaUrl: string,
    adminToken: string,
    org: string,
    giteaContainer?: string
): Promise<string> {
    if (adminToken) {
        const apiUrl = `${giteaUrl.replace(/\/+$/, "")}/api/v1/admin/runners/registration-token`;
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `token ${adminToken}`,
            },
            body: JSON.stringify({ scope: org }),
        });
        if (res.ok) {
            const data = await res.json();
            if (data.token) return data.token;
        }
    }

    const container = giteaContainer || "gitea";
    return dockerExec(container, `gitea actions generate-runner-token --scope "${org}"`).trim();
}

export async function validateToken(giteaUrl: string, adminToken: string): Promise<boolean> {
    if (!adminToken) return false;
    const apiUrl = `${giteaUrl.replace(/\/+$/, "")}/api/v1/version`;
    try {
        const res = await fetch(apiUrl, { headers: { Authorization: `token ${adminToken}` } });
        return res.ok;
    } catch {
        return false;
    }
}
