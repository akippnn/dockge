<template>
    <template v-for="ext in matching" :key="ext.name">
        <component :is="ext.component" v-bind="$attrs" />
    </template>
</template>

<script>
import arcturusStackBadge from "../extensions/arcturus/StackBadge.vue";
import arcturusDeployButton from "../extensions/arcturus/DeployButton.vue";
import arcturusSettings from "../extensions/arcturus/Settings.vue";
import arcturusNavLink from "../extensions/arcturus/NavLink.vue";
import arcturusHomeWidget from "../extensions/arcturus/HomeWidget.vue";
import discordSettings from "../../../extensions/discord/frontend/components/DiscordSettings.vue";

const extComponentMap = {
    arcturus: {
        "stack-detail-header": arcturusStackBadge,
        "stack-detail-actions": arcturusDeployButton,
        "settings-pages": arcturusSettings,
        "header-nav": arcturusNavLink,
        "home-overview": arcturusHomeWidget,
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
    data() {
        return {
            enabledExtensions: new Set(),
            loaded: false,
        };
    },
    async mounted() {
        try {
            const res = await fetch("/api/extensions/list");
            const list = await res.json();
            for (const ext of list) {
                if (ext.enabled) this.enabledExtensions.add(ext.name.toLowerCase());
            }
        } catch { /* ignore */ }
        this.loaded = true;
    },
    computed: {
        matching() {
            const list = [];
            for (const [extName, slots] of Object.entries(extComponentMap)) {
                const extKey = extName.toLowerCase();
                if (this.loaded && !this.enabledExtensions.has(extKey)) continue;
                if (this.extensionName && this.extensionName !== extKey) continue;
                const comp = slots[this.slotName];
                if (comp) list.push({ name: extName, component: comp });
            }
            return list;
        },
    },
};
</script>
