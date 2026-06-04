<template>
    <li v-if="enabled" class="nav-item me-2">
        <router-link to="/extensions/arcturus" class="nav-link" :class="{ active: isActive }">
            <Layers :size="16" class="me-1" />Arcturus
        </router-link>
    </li>
</template>

<script>
import { Layers } from "lucide-vue-next";
export default {
    components: { Layers },
    data() { return { enabled: false, isActive: false }; },
    watch: {
        $route() { this.isActive = this.$route?.path?.startsWith("/extensions/arcturus"); },
    },
    async mounted() {
        try {
            const res = await fetch("/api/extensions/list");
            const list = await res.json();
            this.enabled = list.find(e => e.name === "Arcturus")?.enabled || false;
            this.isActive = this.$route?.path?.startsWith("/extensions/arcturus");
        } catch { /* ignore */ }
    },
};
</script>
