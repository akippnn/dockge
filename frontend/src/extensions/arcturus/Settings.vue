<template>
    <div>
        <h6>Arcturus Runners</h6>
        <div class="d-flex align-items-center justify-content-between mb-2">
            <DgText variant="muted" size="sm">Manage runner containers across organizations.</DgText>
            <DgButton variant="primary" size="sm" @click="showCreate = true">
                + Create Runner
            </DgButton>
        </div>

        <!-- Create runner form -->
        <div v-if="showCreate" class="dg-card mb-3">
            <DgFormGroup label="Organization name" help-text="Any Gitea org — u128, MProjects, or your own.">
                <DgFormInput v-model="newOrg" placeholder="e.g. my-org" />
            </DgFormGroup>
            <DgButton :loading="creating" @click="createRunner">Create</DgButton>
            <DgButton variant="default" @click="showCreate = false" class="ms-2">Cancel</DgButton>
        </div>

        <hr class="dg-divider" />

        <DgText v-if="runners.length === 0" variant="muted" size="sm">No runners configured. Create one above.</DgText>

        <div v-for="r in runners" :key="r.name" class="d-flex align-items-center mb-2">
            <Orb :color="r.state === 'running' ? 'green' : 'red'" :size="8" class="me-2" />
            <div class="flex-grow-1">
                <strong class="small">{{ r.label }}</strong>
                <DgText variant="muted" size="sm" class="ms-1">({{ r.org }})</DgText>
                <DgText variant="muted" size="sm" class="ms-1">{{ r.status }}</DgText>
            </div>
            <DgButton variant="danger" size="sm" @click="deleteRunner(r.name)">Remove</DgButton>
        </div>

        <hr class="dg-divider" />

        <h6>Gitea Connection</h6>
        <DgText variant="muted" size="sm">Requires an admin token with <code>sudo:admin</code> scope for runner registration.</DgText>

        <form autocomplete="off" @submit.prevent="saveSettings">
            <DgFormGroup label="Gitea URL">
                <DgFormInput v-model="form.giteaUrl" placeholder="http://gitea-tailscale:3000" />
            </DgFormGroup>
            <DgFormGroup label="Gitea Admin Token" help-text="Personal access token with sudo:admin scope. Used to generate runner registration tokens via the Gitea REST API.">
                <DgFormInput v-model="form.giteaAdminToken" type="password" placeholder="Leave empty to use docker exec fallback" />
            </DgFormGroup>
            <DgButton type="button" variant="info" size="sm" @click="testToken">
                {{ testing ? 'Testing...' : 'Test Connection' }}
            </DgButton>
            <DgText v-if="tokenTestResult !== null" :variant="tokenTestResult ? 'success' : 'danger'" size="sm" class="ms-2">
                {{ tokenTestResult ? 'Token valid' : 'Connection failed' }}
            </DgText>

            <hr class="dg-divider" />

            <h6>Runner Defaults</h6>
            <DgFormGroup label="Runner Network" help-text="Docker network to attach runner containers to.">
                <DgFormInput v-model="form.runnerNetwork" placeholder="internal_routing" />
            </DgFormGroup>
            <DgFormGroup label="Runner Labels" help-text="Default labels for newly created runners.">
                <DgFormInput v-model="form.runnerLabels" placeholder="ubuntu-latest:docker://..." />
            </DgFormGroup>

            <hr class="dg-divider" />

            <h6>Deploy Service</h6>
            <DgFormGroup label="Arcturus Deploy URL">
                <DgFormInput v-model="form.arcturusDeployUrl" placeholder="http://arcturus-deploy:8080" />
            </DgFormGroup>

            <DgButton type="submit" :loading="saving">Save Settings</DgButton>
            <DgText v-if="saved" variant="success" class="ms-2">Saved</DgText>
        </form>
    </div>
</template>

<script>
import Orb from "../../components/Orb.vue";
import DgButton from "../../components/dg/DgButton.vue";
import DgText from "../../components/dg/DgText.vue";
import DgFormInput from "../../components/dg/DgFormInput.vue";
import DgFormGroup from "../../components/dg/DgFormGroup.vue";

export default {
    components: { Orb, DgButton, DgText, DgFormInput, DgFormGroup },
    data() {
        return {
            runners: [],
            showCreate: false,
            newOrg: "",
            creating: false,
            form: {
                arcturusDeployUrl: "", giteaUrl: "", giteaAdminToken: "",
                runnerNetwork: "", runnerLabels: "",
            },
            saving: false, saved: false,
            testing: false, tokenTestResult: null,
        };
    },
    mounted() { this.loadRunners(); this.loadSettings(); },
    methods: {
        async loadRunners() {
            try {
                const res = await fetch("/api/extensions/arcturus/runners");
                const data = await res.json();
                this.runners = data.runners || [];
            } catch { /* ignore */ }
        },
        async createRunner() {
            if (!this.newOrg.trim()) return;
            this.creating = true;
            try {
                await fetch("/api/extensions/arcturus/runners/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ org: this.newOrg.trim() }),
                });
                this.showCreate = false;
                this.newOrg = "";
                await this.loadRunners();
            } catch { /* ignore */ }
            this.creating = false;
        },
        async deleteRunner(name) {
            try {
                await fetch(`/api/extensions/arcturus/runners/${encodeURIComponent(name)}`, { method: "DELETE" });
                await this.loadRunners();
            } catch { /* ignore */ }
        },
        async loadSettings() {
            try {
                const res = await fetch("/api/extensions/arcturus/settings");
                const data = await res.json();
                this.form.arcturusDeployUrl = data.arcturusDeployUrl || "";
                this.form.giteaUrl = data.giteaUrl || "";
                this.form.runnerNetwork = data.runnerNetwork || "";
                this.form.runnerLabels = data.runnerLabels || "";
                this.giteaTokenConfigured = data.giteaAdminTokenConfigured || false;
            } catch { /* ignore */ }
        },
        async saveSettings() {
            this.saving = true;
            try {
                const allowed = ["arcturusDeployUrl", "giteaUrl", "giteaAdminToken", "runnerNetwork", "runnerLabels"];
                const body = {};
                for (const key of allowed) {
                    if (this.form[key] !== undefined && this.form[key] !== "") {
                        body[key] = this.form[key];
                    }
                }
                await fetch("/api/extensions/arcturus/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                this.saved = true; setTimeout(() => this.saved = false, 3000);
            } catch { /* ignore */ }
            this.saving = false;
        },
        async testToken() {
            this.testing = true;
            this.tokenTestResult = null;
            try {
                const token = this.form.giteaAdminToken || undefined;
                const res = await fetch("/api/extensions/arcturus/validate-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                const data = await res.json();
                this.tokenTestResult = data.valid;
            } catch { this.tokenTestResult = false; }
            this.testing = false;
        },
    },
};
</script>
