<template>
    <div>
        <h6>Discord Notifications</h6>
        <p class="text-muted small">Sends stack lifecycle notifications to a Discord channel via webhook.</p>

        <form autocomplete="off" @submit.prevent="save">
            <div class="mb-3">
                <label class="form-label">Discord Webhook URL</label>
                <input v-model="webhookUrl" class="form-control" type="url" placeholder="https://discord.com/api/webhooks/..." />
                <div class="form-text">Notifications for start, stop, restart, deploy, and delete events.</div>
            </div>
            <button class="btn btn-primary" type="submit" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>Save
            </button>
            <span v-if="saved" class="text-success ms-2">Saved</span>
        </form>
    </div>
</template>

<script>
export default {
    data() { return { webhookUrl: "", saving: false, saved: false }; },
    mounted() { this.load(); },
    methods: {
        async load() {
            try {
                const res = await fetch("/api/extensions/discord/settings");
                const data = await res.json();
                this.webhookUrl = data.webhookUrl || "";
            } catch { /* ignore */ }
        },
        async save() {
            this.saving = true;
            try {
                await fetch("/api/extensions/discord/settings", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ webhookUrl: this.webhookUrl }),
                });
                this.saved = true; setTimeout(() => this.saved = false, 3000);
            } catch { /* ignore */ }
            this.saving = false;
        },
    },
};
</script>
