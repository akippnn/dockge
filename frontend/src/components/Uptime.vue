<template>
    <span :class="['dg-pill', `dg-pill--${statusClass}`]">
        <Orb :color="orbColor" :size="10" :title="statusName" />
        <span v-if="showLabel" class="uptime__label">{{ statusName }}</span>
    </span>
</template>

<script>
import { statusColor, statusNameShort } from "../../../common/util-common";
import Orb from "./Orb.vue";

const colorMap = { primary: "green", danger: "red", dark: "gray", secondary: "gray" };
const statusClassMap = { primary: "running", danger: "exited", dark: "inactive", secondary: "unknown" };

export default {
    components: { Orb },
    props: {
        stack: { type: Object, default: null },
        showLabel: { type: Boolean, default: true },
    },
    computed: {
        color() { return statusColor(this.stack?.status); },
        orbColor() { return colorMap[this.color] || "gray"; },
        statusClass() { return statusClassMap[this.color] || "unknown"; },
        statusName() { return this.$t(statusNameShort(this.stack?.status)); },
    },
};
</script>

<style lang="scss" scoped>
.uptime__label { font-weight: 500; }
</style>
