<template>
    <DgCard>
        <h4 class="mb-3">
            <Layers :size="18" class="me-1 dg-icon-accent" />Arcturus
        </h4>
        <div v-if="!loaded">
            <DgText variant="muted" size="sm">Loading...</DgText>
        </div>
        <div v-else>
            <div class="mb-2 d-flex align-items-center gap-2">
                <DgText variant="muted" size="sm">Runners:</DgText>
                <strong>{{ runners.length }}</strong>
                <span v-if="anyBusy" class="ms-1">
                    <Orb color="yellow" :size="8" class="me-1" />
                    <DgText variant="warning" size="sm">Busy</DgText>
                </span>
                <span v-else class="ms-1">
                    <Orb color="green" :size="8" class="me-1" />
                    <DgText variant="success" size="sm">Idle</DgText>
                </span>
            </div>
            <div class="mb-2 d-flex align-items-center gap-2">
                <DgText variant="muted" size="sm">Managed stacks:</DgText>
                <strong>{{ managedCount }}</strong>
            </div>
        </div>
    </DgCard>
</template>

<script>
import { Layers } from "lucide-vue-next";
import Orb from "../../components/Orb.vue";
import DgCard from "../../components/dg/DgCard.vue";
import DgText from "../../components/dg/DgText.vue";

export default {
    components: { Layers, Orb, DgCard, DgText },
    data() { return { loaded: false, runners: [], anyBusy: false, managedCount: 0 }; },
    async mounted() {
        try {
            const [s, r] = await Promise.all([
                fetch("/api/extensions/arcturus/stacks"),
                fetch("/api/extensions/arcturus/runners"),
            ]);
            const stacks = await s.json();
            const runnersData = await r.json();
            this.runners = runnersData.runners || [];
            this.anyBusy = runnersData.anyBusy || false;
            this.managedCount = stacks.stacks?.filter(x => x.managedByArcturus).length || 0;
            this.loaded = true;
        } catch { this.loaded = true; }
    },
};
</script>
