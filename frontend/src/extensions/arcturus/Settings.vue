<template>
    <div>
        <h6>Arcturus Deployment</h6>
        <DgText variant="muted" size="sm">Manages stacks deployed via terraform. Monitors runner build activity.</DgText>

        <form autocomplete="off" @submit.prevent="save">
            <DgFormGroup label="Arcturus Deploy URL">
                <DgFormInput v-model="form.arcturusDeployUrl" placeholder="http://arcturus-deploy:8080" />
            </DgFormGroup>
            <DgFormGroup label="Gitea API Token" help-text="Used to check if a runner is busy before deploying.">
                <DgFormInput v-model="form.giteaToken" type="password" placeholder="For runner build status" />
            </DgFormGroup>
            <DgFormGroup label="Gitea URL">
                <DgFormInput v-model="form.giteaUrl" placeholder="http://gitea-tailscale:3000" />
            </DgFormGroup>
            <DgButton type="submit" :loading="saving">Save</DgButton>
            <DgText v-if="saved" variant="success" class="ms-2">Saved</DgText>
        </form>

        <hr class="dg-divider" />

        <h6>Managed Stacks</h6>
        <DgText variant="muted" size="sm">Stacks deployed via arcturus/deploy (terraform) appear here.</DgText>
        <div v-if="managedStacks.length === 0">
            <DgText variant="muted" size="sm">No managed stacks detected.</DgText>
        </div>
        <div v-for="s in managedStacks" :key="s.name" class="d-flex align-items-center mb-2">
            <DgText :variant="s.status === 'running' ? 'success' : 'muted'">●</DgText>
            <span class="ms-2">{{ s.name }}</span>
            <DgBadge variant="secondary" class="ms-2">{{ s.status }}</DgBadge>
            <DgButton v-if="!s.deploying" variant="info" size="sm" class="ms-2" @click="deploy(s.name)">Deploy</DgButton>
        </div>

        <hr class="dg-divider" />

        <h6>Runner Status</h6>
        <div v-if="runners.length === 0">
            <DgText variant="muted" size="sm">No runner data. Configure a Gitea token above.</DgText>
        </div>
        <div v-for="r in runners" :key="r.id" class="small mb-1">
            <DgText :variant="r.busy ? 'warning' : 'success'">●</DgText>
            {{ r.name }} — {{ r.busy ? "Busy" : "Idle" }}
        </div>
    </div>
</template>

<script>
import DgButton from "../../components/dg/DgButton.vue";
import DgText from "../../components/dg/DgText.vue";
import DgBadge from "../../components/dg/DgBadge.vue";
import DgFormInput from "../../components/dg/DgFormInput.vue";
import DgFormGroup from "../../components/dg/DgFormGroup.vue";

export default {
    components: { DgButton, DgText, DgBadge, DgFormInput, DgFormGroup },
    data() {
        return {
            form: { arcturusDeployUrl: "", giteaToken: "", giteaUrl: "" },
            saving: false, saved: false,
            runners: [], managedStacks: [],
        };
    },
    mounted() { this.load(); this.pollRunners(); this.loadStacks(); },
    methods: {
        async load() {
            try {
                const res = await fetch("/api/extensions/arcturus/settings");
                const data = await res.json();
                this.form.arcturusDeployUrl = data.arcturusDeployUrl || "";
                this.form.giteaUrl = data.giteaUrl || "";
            } catch { /* ignore */ }
        },
        async save() {
            this.saving = true;
            try {
                const body = {};
                if (this.form.arcturusDeployUrl) body.arcturusDeployUrl = this.form.arcturusDeployUrl;
                if (this.form.giteaToken) body.giteaToken = this.form.giteaToken;
                if (this.form.giteaUrl) body.giteaUrl = this.form.giteaUrl;
                await fetch("/api/extensions/arcturus/settings", {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
                });
                this.saved = true; setTimeout(() => this.saved = false, 3000);
            } catch { /* ignore */ }
            this.saving = false;
        },
        async pollRunners() {
            try {
                const res = await fetch("/api/extensions/arcturus/runners");
                const data = await res.json();
                this.runners = data.runners || [];
            } catch { /* ignore */ }
        },
        async loadStacks() {
            try {
                const res = await fetch("/api/extensions/arcturus/stacks");
                const data = await res.json();
                this.managedStacks = data.stacks?.filter((s) => s.managedByArcturus) || [];
            } catch { /* ignore */ }
        },
        async deploy(name) {
            try {
                await fetch("/api/extensions/arcturus/deploy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stack: name }),
                });
                setTimeout(() => this.loadStacks(), 3000);
            } catch { /* ignore */ }
        },
    },
};
</script>
