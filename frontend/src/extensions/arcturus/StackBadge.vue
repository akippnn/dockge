<template>
    <span v-if="stack.managedByArcturus === true || stack.managedBy === 'terraform'" class="badge bg-info ms-1" style="font-size: 0.5em; vertical-align: middle;">
        <Layers :size="10" class="me-1" />Arcturus
    </span>
</template>

<script>
import { Layers } from "lucide-vue-next";
export default {
    components: { Layers },
    props: { stack: { type: Object, required: true } },
};
</script>
