<template>
    <div class="shadow-box">
        <div class="my-4">
            <div class="mb-3">
                <label class="form-label">{{ $t("Status") }}</label>
                <div>
                    <span class="small" v-if="config.discord_configured" class="text-success">
                        <font-awesome-icon icon="check-circle" /> Discord webhook configured
                    </span>
                    <span class="small" v-else class="text-muted">
                        <font-awesome-icon icon="info-circle" /> Discord not configured
                    </span>
                </div>
            </div>
            <form autocomplete="off" @submit.prevent="saveDiscord">
                <div class="mb-3">
                    <label for="discordUrl" class="form-label">Webhook URL</label>
                    <input id="discordUrl" v-model="discordUrl" class="form-control" type="url" placeholder="https://discord.com/api/webhooks/..." />
                </div>
                <button class="btn btn-primary" type="submit" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>{{ $t("Save") }}
                </button>
                <span v-if="saved" class="text-success ms-2 small">{{ $t("Saved") }}</span>
            </form>
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return { config: { discord_configured: false }, discordUrl: "", status: "loading", saving: false, saved: false };
    },
    mounted() { this.load(); },
    methods: {
        async load() {
            try {
                const res = await fetch("/api/webhook/settings");
                if (res.ok) this.config = await res.json();
            } catch { /* ignore */ }
        },
        async saveDiscord() {
            this.saving = true;
            try {
                const secret = this.$root.socket?.auth?.token || localStorage.getItem("token");
                await fetch("/api/webhook/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
                    body: JSON.stringify({ discordWebhookUrl: this.discordUrl }),
                });
                this.saved = true; setTimeout(() => this.saved = false, 3000);
            } catch { /* ignore */ }
            this.saving = false;
        },
    },
};
</script>
