<template>
    <div v-if="!enabled && loaded">
        <h1 class="mb-3">Arcturus</h1>
        <p class="text-muted">This extension is disabled. Enable it in Settings → Extensions.</p>
    </div>
    <div v-else-if="enabled">
        <h1 class="mb-3">Arcturus</h1>
        <ArcturusOverview />
        <hr class="my-4" />
        <ArcturusSettings />
    </div>
    <div v-else>
        <p class="text-muted">Loading...</p>
    </div>
</template>

<script>
import ArcturusOverview from "./HomeWidget.vue";
import ArcturusSettings from "./Settings.vue";

export default {
    components: { ArcturusOverview, ArcturusSettings },
    data() {
        return { enabled: false, loaded: false };
    },
    async mounted() {
        try {
            const res = await fetch("/api/extensions/list");
            const list = await res.json();
            this.enabled = list.find(e => e.name === "Arcturus")?.enabled || false;
        } catch { /* ignore */ }
        this.loaded = true;
    },
};
</script>
