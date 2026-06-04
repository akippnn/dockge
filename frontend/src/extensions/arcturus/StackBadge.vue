<template>
    <DgBadge v-if="stack.managedByArcturus === true || stack.managedBy === 'terraform'" variant="info" title="Managed by Arcturus">
        <Layers :size="10" /> Arcturus
    </DgBadge>
</template>

<script>
import { Layers } from "lucide-vue-next";
import DgBadge from "../../components/dg/DgBadge.vue";

export default {
    components: { Layers, DgBadge },
    props: { stack: { type: Object, required: true } },
};
</script>
