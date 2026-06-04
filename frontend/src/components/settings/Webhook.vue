<template>
    <div>
        <div class="my-4">
            <div class="mb-3">
                <label class="form-label">{{ $t("Status") }}</label>
                <div>
                    <span v-if="status === 'loading'" class="text-muted">{{ $t("Loading") }}...</span>
                    <span v-else>
                        <span v-if="config.webhook_secret_configured" class="text-success">
                            <font-awesome-icon icon="check-circle" /> Webhook secret configured
                        </span>
                        <span v-else class="text-danger">
                            <font-awesome-icon icon="times-circle" /> Webhook secret not configured
                        </span>
                        <br />
                        <span v-if="config.discord_configured" class="text-success">
                            <font-awesome-icon icon="check-circle" /> Discord webhook configured
                        </span>
                        <span v-else class="text-muted">
                            <font-awesome-icon icon="info-circle" /> Discord webhook not configured
                        </span>
                        <br />
                        <span class="text-muted small">
                            Arcturus Deploy URL: {{ config.arcturus_deploy_url }}
                        </span>
                    </span>
                </div>
            </div>

            <hr />

            <form autocomplete="off" @submit.prevent="saveWebhook">
                <div class="mb-3">
                    <label for="currentSecret" class="form-label">Current Webhook Secret</label>
                    <input id="currentSecret" v-model="currentSecret" class="form-control" type="password" placeholder="Required to save changes" />
                    <div class="form-text">Enter the current webhook secret to authorize changes.</div>
                </div>

                <div class="mb-3">
                    <label for="discordUrl" class="form-label">Discord Webhook URL</label>
                    <input id="discordUrl" v-model="form.discordWebhookUrl" class="form-control" type="url" placeholder="https://discord.com/api/webhooks/..." />
                    <div class="form-text">Leave empty to keep current. Notifications for stack start/stop/restart/deploy events.</div>
                </div>

                <div class="mb-3">
                    <label for="deployUrl" class="form-label">Arcturus Deploy URL</label>
                    <input id="deployUrl" v-model="form.arcturusDeployUrl" class="form-control" type="url" placeholder="http://arcturus-deploy:8080" />
                    <div class="form-text">Leave empty to keep current.</div>
                </div>

                <div class="mb-3">
                    <label for="webhookSecret" class="form-label">New Webhook Secret</label>
                    <input id="webhookSecret" v-model="form.webhookSecret" class="form-control" type="password" placeholder="Leave empty to keep current" />
                    <div class="form-text">Shared secret for authenticating webhook requests.</div>
                </div>

                <div>
                    <button class="btn btn-primary" type="submit" :disabled="saving || !currentSecret">
                        <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
                        {{ $t("Save") }}
                    </button>
                    <span v-if="saved" class="text-success ms-2">{{ $t("Saved") }}</span>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            config: {
                webhook_secret_configured: false,
                discord_configured: false,
                arcturus_deploy_url: "http://arcturus-deploy:8080",
            },
            form: {
                discordWebhookUrl: "",
                arcturusDeployUrl: "",
                webhookSecret: "",
            },
            currentSecret: "",
            status: "loading",
            saving: false,
            saved: false,
        };
    },

    mounted() {
        this.loadConfig();
    },

    methods: {
        async loadConfig() {
            this.status = "loading";
            try {
                const res = await fetch("/api/webhook/settings");
                if (res.ok) {
                    this.config = await res.json();
                }
            } catch (e) {
                this.config.webhook_secret_configured = false;
            }
            this.status = "loaded";
        },

        async saveWebhook() {
            this.saving = true;
            this.saved = false;
            try {
                const body = {};
                if (this.form.discordWebhookUrl) body.discordWebhookUrl = this.form.discordWebhookUrl;
                if (this.form.arcturusDeployUrl) body.arcturusDeployUrl = this.form.arcturusDeployUrl;
                if (this.form.webhookSecret) body.webhookSecret = this.form.webhookSecret;
                const res = await fetch("/api/webhook/settings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.currentSecret}`,
                    },
                    body: JSON.stringify(body),
                });
                const data = await res.json();
                if (data.ok) {
                    this.saved = true;
                    setTimeout(() => { this.saved = false; }, 3000);
                }
                this.$root.toastRes(data);
                await this.loadConfig();
            } catch (e) {
                this.$root.toastError("Failed to save webhook settings");
            }
            this.saving = false;
        },
    },
};
</script>
