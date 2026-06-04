export interface RunnerStatus {
    id: number;
    name: string;
    status: string;
    busy: boolean;
}

export async function probeRunners(giteaUrl: string, giteaToken: string): Promise<RunnerStatus[]> {
    if (!giteaUrl || !giteaToken) return [];
    try {
        const url = `${giteaUrl.replace(/\/+$/, "")}/api/v1/admin/actions/runners`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${giteaToken}` },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.runners || [];
    } catch {
        return [];
    }
}

export function anyRunnerBusy(runners: RunnerStatus[]): boolean {
    return runners.some(r => r.busy);
}
