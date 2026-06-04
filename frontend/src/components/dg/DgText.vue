<template>
    <span :class="['dg-text', variantClass, sizeClass]">
        <slot />
    </span>
</template>

<script>
export default {
    name: "DgText",
    props: {
        variant: { type: String, default: "default", validator: v => ["default", "muted", "success", "warning", "danger", "info"].includes(v) },
        size: { type: String, default: "md", validator: v => ["sm", "md"].includes(v) },
    },
    computed: {
        variantClass() { return this.variant === "default" ? "" : `dg-text--${this.variant}`; },
        sizeClass() { return this.size === "sm" ? "dg-text--sm" : ""; },
    },
};
</script>
