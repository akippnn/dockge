<template>
    <span v-if="stack.managedByArcturus && !isEditMode" class="ms-2">
        <button
            class="btn btn-sm btn-outline-info"
            :disabled="deploying || runnerBusy"
            @click="triggerDeploy"
        >
            <span v-if="deploying" class="spinner-border spinner-border-sm me-1" role="status"></span>
            <font-awesome-icon icon="cubes" class="me-1" />
            {{ runnerBusy ? "Build in progress…" : "Deploy" }}
        </button>
        <span v-if="lastStatus" class="ms-1 small" :class="statusClass">{{ lastStatus }}</span>
    </span>
</template>

<script>
export default {
    props: { stack: { type: Object, required: true } },
    data() {
        return { deploying: false, runnerBusy: false, lastStatus: "" };
    },
    computed: {
        isEditMode() { return false; }, // Simplified — actual value from parent
        statusClass() {
            if (this.lastStatus === "ok") return "text-success";
            if (this.lastStatus === "error") return "text-danger";
            return "text-muted";
        },
    },
    mounted() {
        this.checkRunners();
        this.interval = setInterval(() => this.checkRunners(), 10000);
    },
    beforeUnmount() {
        clearInterval(this.interval);
    },
    methods: {
        async checkRunners() {
            try {
                const res = await fetch("/api/extensions/arcturus/runners");
                const data = await res.json();
                this.runnerBusy = data.anyBusy;
            } catch { /* ignore */ }
        },
        async triggerDeploy() {
            this.deploying = true;
            try {
                const res = await fetch("/api/extensions/arcturus/deploy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stack: this.stack.name }),
                });
                const data = await res.json();
                this.lastStatus = data.status || "error";
                setTimeout(() => { this.lastStatus = ""; }, 10000);
            } catch {
                this.lastStatus = "error";
            }
            this.deploying = false;
        },
    },
};
</script>
