<template>
    <li class="nav-item me-2">
        <router-link to="/extensions/arcturus" class="nav-link" :class="{ active: isActive }">
            <Layers :size="16" class="me-1" />Arcturus
        </router-link>
    </li>
</template>

<script>
import { Layers } from "lucide-vue-next";
export default {
    components: { Layers },
    data() { return { isActive: false }; },
    watch: {
        $route() { this.isActive = this.$route?.path?.startsWith("/extensions/arcturus"); },
    },
    mounted() {
        this.isActive = this.$route?.path?.startsWith("/extensions/arcturus");
    },
};
</script>
