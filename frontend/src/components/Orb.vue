<template>
    <span class="orb" :class="[`orb--${color}`, `orb--${size}`]" :title="title">
        <span v-if="spinning" class="orb__spinner" />
    </span>
</template>

<script>
export default {
    props: {
        color: { type: String, default: "gray", validator: v => ["green", "yellow", "red", "gray"].includes(v) },
        spinning: { type: Boolean, default: false },
        title: { type: String, default: "" },
        size: { type: Number, default: 12 },
    },
};
</script>

<style lang="scss" scoped>
.orb {
    display: inline-block;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
}
.orb--8 { width: 8px; height: 8px; }
.orb--10 { width: 10px; height: 10px; }
.orb--12 { width: 12px; height: 12px; }
.orb--14 { width: 14px; height: 14px; }
.orb--green { background: #2ecc71; }
.orb--yellow { background: #f39c12; }
.orb--red { background: #e74c3c; }
.orb--gray { background: #484f58; }
.orb__spinner {
    position: absolute;
    inset: -3px;
    border: 2px solid #484f58;
    border-top-color: #74c2ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
