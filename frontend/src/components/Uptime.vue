<template>
    <span class="d-inline-flex align-items-center gap-1">
        <Orb :color="orbColor" :size="12" :title="statusName" />
        <span v-if="showLabel" class="small">{{ statusName }}</span>
    </span>
</template>

<script>
import { statusColor, statusNameShort } from "../../../common/util-common";
import Orb from "./Orb.vue";

const colorMap = { green: "green", yellow: "yellow", red: "red", gray: "gray" };

export default {
    components: { Orb },
    props: {
        stack: { type: Object, default: null },
        showLabel: { type: Boolean, default: false },
        pill: { type: Boolean, default: false },
    },
    computed: {
        color() { return statusColor(this.stack?.status); },
        orbColor() { return colorMap[this.color] || "gray"; },
        statusName() { return this.$t(statusNameShort(this.stack?.status)); },
    },
};
</script>
