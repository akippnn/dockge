<template>
    <div>
        <h1 class="mb-3">Arcturus</h1>
        <ArcturusOverview />
        <hr class="my-4" />
        <ArcturusSettings />
    </div>
</template>

<script>
import ArcturusOverview from "./HomeWidget.vue";
import ArcturusSettings from "./Settings.vue";
export default {
    components: { ArcturusOverview, ArcturusSettings },
};
</script>
