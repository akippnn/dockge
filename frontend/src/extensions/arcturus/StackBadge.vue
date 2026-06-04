<template>
    <DgBadge v-if="show" variant="info" title="Managed by Arcturus">
        <Layers :size="10" /> Arcturus
    </DgBadge>
</template>

<script>
import { Layers } from "lucide-vue-next";
import DgBadge from "../../components/dg/DgBadge.vue";

export default {
    components: { Layers, DgBadge },
    props: { stack: { type: Object, required: true } },
    computed: {
        show() {
            return this.stack.managedByArcturus === true || this.stack.managedBy === "terraform";
        },
    },
};
</script>
