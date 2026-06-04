<template>
    <div class="shadow-box big-padding">
        <h4 class="mb-3">
            <Layers :size="18" class="me-1" color="#74c2ff" />Arcturus
        </h4>
        <div v-if="!loaded" class="text-muted small">Loading...</div>
        <div v-else>
            <div class="mb-2 d-flex align-items-center gap-2">
                <span class="text-muted small">Managed:</span>
                <strong>{{ managedCount }}</strong>
            </div>
            <div class="mb-2 d-flex align-items-center gap-2">
                <span class="text-muted small">Runner:</span>
                <span class="small" :class="anyBusy ? 'text-warning' : 'text-success'">
                    <Orb :color="anyBusy ? 'yellow' : 'green'" :size="8" class="me-1" />
                    {{ anyBusy ? 'Building' : 'Idle' }}
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { Layers } from "lucide-vue-next";
import Orb from "../../components/Orb.vue";
export default {
    components: { Layers, Orb },
    data() { return { loaded: false, managedCount: 0, anyBusy: false }; },
    async mounted() {
        try {
            const [s, r] = await Promise.all([
                fetch("/api/extensions/arcturus/stacks"),
                fetch("/api/extensions/arcturus/runners"),
            ]);
            const stacks = await s.json();
            const runners = await r.json();
            this.managedCount = stacks.stacks?.filter(x => x.managedByArcturus).length || 0;
            this.anyBusy = runners.anyBusy || false;
            this.loaded = true;
        } catch { this.loaded = true; }
    },
};
</script>
