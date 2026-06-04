<template>
<<<<<<< HEAD
    <div class="shadow-box">
=======
    <div>
>>>>>>> feat/extensions
        <div class="my-4">
            <div class="mb-3">
                <label class="form-label">{{ $t("Status") }}</label>
                <div>
<<<<<<< HEAD
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
=======
                    <span v-if="status === 'loading'" class="text-muted">{{ $t("Loading") }}...</span>
                    <span v-else>
                        <span v-if="config.discord_configured" class="text-success">
                            <font-awesome-icon icon="check-circle" /> Discord webhook configured
                        </span>
                        <span v-else class="text-muted">
                            <font-awesome-icon icon="info-circle" /> Discord webhook not configured
                        </span>
                    </span>
                </div>
            </div>

            <form autocomplete="off" @submit.prevent="saveDiscord">
                <div class="mb-3">
                    <label for="discordUrl" class="form-label">Discord Webhook URL</label>
>>>>>>> feat/extensions
                    <input id="discordUrl" v-model="discordUrl" class="form-control" type="url" placeholder="https://discord.com/api/webhooks/..." />
                </div>
                <button class="btn btn-primary" type="submit" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>{{ $t("Save") }}
                </button>
<<<<<<< HEAD
                <span v-if="saved" class="text-success ms-2 small">{{ $t("Saved") }}</span>
=======
                <span v-if="saved" class="text-success ms-2">{{ $t("Saved") }}</span>
>>>>>>> feat/extensions
            </form>
        </div>
    </div>
</template>
<<<<<<< HEAD
<script>
export default {
    data() {
        return { config: { discord_configured: false }, discordUrl: "", status: "loading", saving: false, saved: false };
=======

<script>
export default {
    data() {
        return {
            config: { discord_configured: false },
            discordUrl: "",
            status: "loading",
            saving: false,
            saved: false,
        };
>>>>>>> feat/extensions
    },
    mounted() { this.load(); },
    methods: {
        async load() {
<<<<<<< HEAD
=======
            this.status = "loading";
>>>>>>> feat/extensions
            try {
                const res = await fetch("/api/webhook/settings");
                if (res.ok) this.config = await res.json();
            } catch { /* ignore */ }
<<<<<<< HEAD
=======
            this.status = "loaded";
>>>>>>> feat/extensions
        },
        async saveDiscord() {
            this.saving = true;
            try {
                const secret = this.$root.socket?.auth?.token || localStorage.getItem("token");
<<<<<<< HEAD
                await fetch("/api/webhook/settings", {
=======
                const res = await fetch("/api/webhook/settings", {
>>>>>>> feat/extensions
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
                    body: JSON.stringify({ discordWebhookUrl: this.discordUrl }),
                });
<<<<<<< HEAD
                this.saved = true; setTimeout(() => this.saved = false, 3000);
=======
                const data = await res.json();
                if (data.ok) { this.saved = true; setTimeout(() => this.saved = false, 3000); }
>>>>>>> feat/extensions
            } catch { /* ignore */ }
            this.saving = false;
        },
    },
};
</script>
