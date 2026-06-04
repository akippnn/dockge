import { execSync } from "child_process";
import { dockerExec } from "./docker-util";

export function generateRunnerToken(org: string): string {
    return dockerExec("gitea", `gitea actions generate-runner-token --scope "${org}"`).trim();
}
