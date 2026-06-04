<template>
    <span :class="['dg-pill', variantClass]" :title="title">
        <slot />
    </span>
</template>

<script>
export default {
    name: "DgBadge",
    props: {
        variant: { type: String, default: "default", validator: v => ["default", "primary", "success", "warning", "danger", "info", "secondary"].includes(v) },
        title: { type: String, default: "" },
    },
    computed: {
        variantClass() { return this.variant === "default" ? "" : `dg-pill--${this.variant}`; },
    },
};
</script>
