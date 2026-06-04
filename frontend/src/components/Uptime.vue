<template>
    <span :class="['uptime', `uptime--${statusClass}`]">
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
@import "../styles/vars";

.uptime {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 50rem;
    font-size: 0.75rem;
    line-height: 1.4;
}
.uptime--running { background: rgba(#4caf50, 0.15); color: #4caf50; }
.uptime--exited  { background: rgba($danger, 0.15); color: $danger; }
.uptime--inactive { background: rgba($dark-font-color3, 0.2); color: $dark-font-color3; }
.uptime--unknown { background: rgba($dark-font-color3, 0.2); color: $dark-font-color3; }
.uptime__label { font-weight: 500; }
</style>
