<template>
    <div>
        <h6>Arcturus Deployment</h6>
        <p class="text-muted small">Manages stacks deployed via terraform. Monitors runner build activity.</p>

        <form autocomplete="off" @submit.prevent="save">
            <div class="mb-3">
                <label class="form-label">Arcturus Deploy URL</label>
                <input v-model="form.arcturusDeployUrl" class="form-control" placeholder="http://arcturus-deploy:8080" />
            </div>
            <div class="mb-3">
                <label class="form-label">Gitea API Token</label>
                <input v-model="form.giteaToken" class="form-control" type="password" placeholder="For runner build status" />
                <div class="form-text">Used to check if a runner is busy before deploying.</div>
            </div>
            <div class="mb-3">
                <label class="form-label">Gitea URL</label>
                <input v-model="form.giteaUrl" class="form-control" placeholder="http://gitea-tailscale:3000" />
            </div>
            <button class="btn btn-primary" type="submit" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>Save
            </button>
            <span v-if="saved" class="text-success ms-2">Saved</span>
        </form>

        <hr />

        <h6>Managed Stacks</h6>
        <p class="text-muted small">Stacks deployed via arcturus/deploy (terraform) appear here.</p>
        <div v-if="managedStacks.length === 0" class="text-muted small">No managed stacks detected.</div>
        <div v-for="s in managedStacks" :key="s.name" class="d-flex align-items-center mb-2">
            <span :class="s.status === 'running' ? 'text-success' : 'text-muted'">●</span>
            <span class="ms-2">{{ s.name }}</span>
            <span class="ms-2 badge bg-secondary">{{ s.status }}</span>
            <button v-if="!s.deploying" class="btn btn-sm btn-outline-info ms-2" @click="deploy(s.name)">Deploy</button>
        </div>

        <hr />
        <h6>Runner Status</h6>
        <div v-if="runners.length === 0" class="text-muted small">No runner data. Configure a Gitea token above.</div>
        <div v-for="r in runners" :key="r.id" class="small mb-1">
            <span :class="r.busy ? 'text-warning' : 'text-success'">●</span>
            {{ r.name }} — {{ r.busy ? "Busy" : "Idle" }}
        </div>
    </div>
</template>

<script>
export default {
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
