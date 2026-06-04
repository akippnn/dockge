<template>
    <div>
        <div class="d-flex align-items-center justify-content-between mb-2">
            <h6>Arcturus Runners</h6>
            <DgButton variant="primary" size="sm" @click="showCreate = true">
                + Create Runner
            </DgButton>
        </div>

        <!-- Create runner form -->
        <div v-if="showCreate" class="dg-card mb-3">
            <DgFormGroup label="Organization">
                <select v-model="newOrg" class="dg-form-input">
                    <option value="u128">u128</option>
                    <option value="MProjects">MProjects</option>
                </select>
            </DgFormGroup>
            <DgButton :loading="creating" @click="createRunner">Create</DgButton>
            <DgButton variant="default" @click="showCreate = false">Cancel</DgButton>
        </div>

        <hr class="dg-divider" />

        <DgText v-if="runners.length === 0" variant="muted" size="sm">No runners configured.</DgText>

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

        <h6>Arcturus Settings</h6>
        <DgText variant="muted" size="sm">Configure the Arcturus deploy service and Gitea connection.</DgText>

        <form autocomplete="off" @submit.prevent="saveSettings">
            <DgFormGroup label="Arcturus Deploy URL">
                <DgFormInput v-model="form.arcturusDeployUrl" placeholder="http://arcturus-deploy:8080" />
            </DgFormGroup>
            <DgFormGroup label="Gitea API Token" help-text="Used to check runner build status on Gitea.">
                <DgFormInput v-model="form.giteaToken" type="password" placeholder="For runner build status" />
            </DgFormGroup>
            <DgFormGroup label="Gitea URL">
                <DgFormInput v-model="form.giteaUrl" placeholder="http://gitea-tailscale:3000" />
            </DgFormGroup>
            <DgButton type="submit" :loading="saving">Save Settings</DgButton>
            <DgText v-if="saved" variant="success" class="ms-2">Saved</DgText>
        </form>
    </div>
</template>

<script>
import Orb from "../components/Orb.vue";
import DgButton from "../components/dg/DgButton.vue";
import DgText from "../components/dg/DgText.vue";
import DgFormInput from "../components/dg/DgFormInput.vue";
import DgFormGroup from "../components/dg/DgFormGroup.vue";

export default {
    components: { Orb, DgButton, DgText, DgFormInput, DgFormGroup },
    data() {
        return {
            runners: [],
            showCreate: false,
            newOrg: "u128",
            creating: false,
            form: { arcturusDeployUrl: "", giteaToken: "", giteaUrl: "" },
            saving: false, saved: false,
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
            this.creating = true;
            try {
                await fetch("/api/extensions/arcturus/runners/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ org: this.newOrg }),
                });
                this.showCreate = false;
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
            } catch { /* ignore */ }
        },
        async saveSettings() {
            this.saving = true;
            try {
                const body = {};
                if (this.form.arcturusDeployUrl) body.arcturusDeployUrl = this.form.arcturusDeployUrl;
                if (this.form.giteaToken) body.giteaToken = this.form.giteaToken;
                if (this.form.giteaUrl) body.giteaUrl = this.form.giteaUrl;
                await fetch("/api/extensions/arcturus/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                this.saved = true; setTimeout(() => this.saved = false, 3000);
            } catch { /* ignore */ }
            this.saving = false;
        },
    },
};
</script>
