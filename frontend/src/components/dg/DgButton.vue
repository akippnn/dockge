<template>
    <button :type="type" :class="['dg-btn', variantClass, sizeClass]" :disabled="disabled || loading" v-bind="$attrs">
        <span v-if="loading" class="dg-spinner" />
        <slot />
    </button>
</template>

<script>
export default {
    name: "DgButton",
    inheritAttrs: false,
    props: {
        variant: { type: String, default: "primary", validator: v => ["primary", "danger", "default", "secondary", "info"].includes(v) },
        size: { type: String, default: "md", validator: v => ["sm", "md"].includes(v) },
        disabled: { type: Boolean, default: false },
        loading: { type: Boolean, default: false },
        type: { type: String, default: "button" },
    },
    computed: {
        variantClass() { return this.variant === "default" ? "" : `dg-btn--${this.variant}`; },
        sizeClass() { return this.size === "sm" ? "dg-btn--sm" : ""; },
    },
};
</script>
