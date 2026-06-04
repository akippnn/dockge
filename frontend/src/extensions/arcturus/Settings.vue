<template>
    <div>
        <h5>Arcturus Extension</h5>
        <p class="text-muted small">Manages stacks deployed via arcturus/deploy. Monitors runner build activity.</p>

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
        <h6>Runner Status</h6>
        <div v-if="runners.length === 0" class="text-muted small">No runner data.</div>
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
            saving: false,
            saved: false,
            runners: [],
        };
    },
    mounted() {
        this.load();
        this.pollRunners();
    },
    methods: {
        async load() {
            try {
                const res = await fetch("/api/extensions/arcturus/settings");
                const data = await res.json();
                this.form.arcturusDeployUrl = data.arcturusDeployUrl;
                this.form.giteaUrl = data.giteaUrl;
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
    },
};
</script>
