<template>
    <template v-for="ext in matching" :key="ext.name">
        <component :is="ext.component" v-bind="$attrs" />
    </template>
</template>

<script>
import arcturusStackBadge from "../extensions/arcturus/StackBadge.vue";
import arcturusDeployButton from "../extensions/arcturus/DeployButton.vue";
import arcturusSettings from "../extensions/arcturus/Settings.vue";
import discordSettings from "../../../extensions/discord/frontend/components/DiscordSettings.vue";

const extComponentMap = {
    arcturus: {
        "stack-detail-header": arcturusStackBadge,
        "stack-detail-actions": arcturusDeployButton,
        "settings-pages": arcturusSettings,
    },
    discord: {
        "settings-pages": discordSettings,
    },
};

export default {
    props: {
        slotName: { type: String, required: true },
        extensionName: { type: String, default: "" },
    },
    computed: {
        matching() {
            const list = [];
            for (const [extName, slots] of Object.entries(extComponentMap)) {
                if (this.extensionName && this.extensionName !== extName) continue;
                const comp = slots[this.slotName];
                if (comp) list.push({ name: extName, component: comp });
            }
            return list;
        },
    },
};
</script>
