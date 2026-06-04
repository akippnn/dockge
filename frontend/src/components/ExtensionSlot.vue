<template>
    <template v-for="ext in matching" :key="ext.name">
        <component :is="ext.component" v-bind="$attrs" />
    </template>
</template>

<script>
import { defineAsyncComponent } from "vue";

const componentLoaders = {
    arcturus: {
        "stack-detail-header": () => import("../extensions/arcturus/StackBadge.vue"),
        "stack-detail-actions": () => import("../extensions/arcturus/DeployButton.vue"),
        "settings-pages": () => import("../extensions/arcturus/Settings.vue"),
        "header-nav": () => import("../extensions/arcturus/NavLink.vue"),
        "home-overview": () => import("../extensions/arcturus/HomeWidget.vue"),
    },
    discord: {
        "settings-pages": () => import("../../../extensions/discord/frontend/components/DiscordSettings.vue"),
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
            for (const [extName, slots] of Object.entries(componentLoaders)) {
                const extKey = extName.toLowerCase();
                if (this.loaded && !this.enabledExtensions.has(extKey)) continue;
                if (this.extensionName && this.extensionName !== extKey) continue;
                const loader = slots[this.slotName];
                if (loader) list.push({ name: extName, component: defineAsyncComponent(loader) });
            }
            return list;
        },
    },
};
</script>
