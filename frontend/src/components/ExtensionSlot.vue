<template>
    <template v-for="ext in matching" :key="ext.name">
        <component :is="ext.component" v-bind="$attrs" />
    </template>
</template>

<script>
import arcturusStackBadge from "../extensions/arcturus/StackBadge.vue";
import arcturusDeployButton from "../extensions/arcturus/DeployButton.vue";
import arcturusSettings from "../extensions/arcturus/Settings.vue";

const extensions = {
    arcturus: {
        components: {
            "stack-detail-header": arcturusStackBadge,
            "stack-detail-actions": arcturusDeployButton,
            "settings-pages": arcturusSettings,
        },
    },
};

export default {
    props: {
        slotName: { type: String, required: true },
    },
    computed: {
        matching() {
            const list = [];
            for (const [extName, ext] of Object.entries(extensions)) {
                const comp = ext.components[this.slotName];
                if (comp) list.push({ name: extName, component: comp });
            }
            return list;
        },
    },
};
</script>
