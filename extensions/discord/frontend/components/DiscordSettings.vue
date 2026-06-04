<template>
    <div>
        <h6>Discord Notifications</h6>
        <DgText variant="muted" size="sm">Sends stack lifecycle notifications to a Discord channel via webhook.</DgText>

        <form autocomplete="off" @submit.prevent="save">
            <DgFormGroup label="Discord Webhook URL" help-text="Notifications for start, stop, restart, deploy, and delete events.">
                <DgFormInput v-model="webhookUrl" type="url" placeholder="https://discord.com/api/webhooks/..." />
            </DgFormGroup>
            <DgButton type="submit" :loading="saving">Save</DgButton>
            <DgText v-if="saved" variant="success" class="ms-2">Saved</DgText>
        </form>
    </div>
</template>

<script>
import DgButton from "../../../../frontend/src/components/dg/DgButton.vue";
import DgFormInput from "../../../../frontend/src/components/dg/DgFormInput.vue";
import DgFormGroup from "../../../../frontend/src/components/dg/DgFormGroup.vue";
import DgText from "../../../../frontend/src/components/dg/DgText.vue";

export default {
    components: { DgButton, DgFormInput, DgFormGroup, DgText },
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
