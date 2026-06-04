<template>
    <span v-if="stack.managedByArcturus === true || stack.managedBy === 'terraform'" class="badge bg-info ms-1" style="font-size: 0.5em; vertical-align: middle;">
        <font-awesome-icon icon="cubes" class="me-1" />Arcturus
    </span>
</template>

<script>
export default {
    props: { stack: { type: Object, required: true } },
};
</script>
