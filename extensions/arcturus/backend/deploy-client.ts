export interface DeployResult {
    status: string;
    action: string;
    stack: string;
    output: string;
}

export async function triggerDeploy(
    deployUrl: string,
    stack: string,
    action: string,
    domain: string,
): Promise<DeployResult | { error: string }> {
    if (!deployUrl) return { error: "Arcturus Deploy URL not configured" };
    try {
        const url = `${deployUrl.replace(/\/+$/, "")}/deploy`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stack, action, domain }),
        });
        return await res.json();
    } catch (e: any) {
        return { error: `Deploy service unreachable: ${e.message}` };
    }
}
