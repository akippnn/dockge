<template>
    <span class="orb" :class="`orb--${color}`" :title="title">
        <span v-if="spinning" class="orb__spinner" />
    </span>
</template>

<script>
export default {
    props: {
        color: { type: String, default: "gray", validator: v => ["green", "yellow", "red", "gray"].includes(v) },
        spinning: { type: Boolean, default: false },
        title: { type: String, default: "" },
    },
};
</script>

<style lang="scss" scoped>
.orb {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
}
.orb--green { background: #2ecc71; }
.orb--yellow { background: #f39c12; }
.orb--red { background: #e74c3c; }
.orb--gray { background: #bdc3c7; }
.orb__spinner {
    position: absolute;
    inset: -3px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    color: #3498db;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
