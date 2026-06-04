<template>
    <div>
        <div v-if="extensions.length === 0" class="text-muted">No extensions available.</div>

        <div v-else class="row">
            <!-- Extension list column -->
            <div class="col-lg-4 col-md-5 mb-3">
                <div class="list-group">
                    <button
                        v-for="ext in extensions"
                        :key="ext.name"
                        class="list-group-item list-group-item-action d-flex align-items-center"
                        :class="{ active: selected === ext.name }"
                        @click="selected = ext.name"
                    >
                        <span class="me-2" :class="statusClass(ext)">{{ statusIcon(ext) }}</span>
                        <span class="flex-grow-1">{{ ext.name }} <small class="text-muted">v{{ ext.version }}</small></span>
                        <span v-if="ext.enabled" class="badge bg-success ms-2">Enabled</span>
                        <span v-else class="badge bg-secondary ms-2">Disabled</span>
                    </button>
                </div>
            </div>

            <!-- Extension detail column -->
            <div class="col-lg-8 col-md-7">
                <div v-if="!selected" class="text-muted">Select an extension from the list.</div>

                <div v-else>
                    <h5>{{ detail.name }}</h5>
                    <p class="text-muted">{{ detail.description }}</p>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Status</label>
                        <div>
                            <button
                                class="btn me-2"
                                :class="detail.enabled ? 'btn-danger' : 'btn-primary'"
                                @click="toggleExtension(detail)"
                            >
                                {{ detail.enabled ? 'Disable' : 'Enable' }}
                            </button>
                            <span v-if="detail.justToggled" class="text-warning">
                                ⟳ Reload required
                                <button class="btn btn-sm btn-outline-warning ms-2" @click="reloadDockge">Reload Now</button>
                            </span>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Permissions Requested</label>
                        <ul class="list-unstyled mb-0">
                            <li v-for="p in detail.permissions" :key="p" class="small">
                                <font-awesome-icon icon="check-circle" class="text-success me-1" /> {{ permissionLabel(p) }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="detail.enabled && detail.capabilities.hooks" class="mb-3">
                        <label class="form-label fw-bold">Active Hooks</label>
                        <div v-for="h in detail.capabilities.hooks" :key="h" class="small text-muted">
                            <font-awesome-icon icon="plug" class="me-1" /> {{ h }}
                        </div>
                    </div>

                    <!-- Extension custom settings component -->
                    <ExtensionSlot v-if="detail.enabled" slot-name="settings-pages" :extension-name="selected" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            extensions: [],
            selected: null,
            justToggled: {},
        };
    },
    computed: {
        detail() {
            const ext = this.extensions.find(e => e.name === this.selected);
            if (!ext) return { permissions: [], capabilities: {} };
            return ext;
        },
    },
    mounted() {
        this.load();
    },
    methods: {
        async load() {
            try {
                const res = await fetch("/api/extensions/list");
                this.extensions = await res.json();
            } catch { /* ignore */ }
        },
        statusClass(ext) {
            return ext.enabled ? "text-success" : "text-secondary";
        },
        statusIcon(ext) {
            return ext.enabled ? "🟢" : "🟡";
        },
        permissionLabel(p) {
            const labels = {
                "stack:read": "Read stack info",
                "stack:badge": "Show badges on stacks",
                "stack:actions": "Add action buttons to stacks",
                "stack:lifecycle:notify": "Receive lifecycle notifications",
                "settings:page": "Add settings page",
                "home:widget": "Add home dashboard widget",
                "nav:link": "Add navigation link",
            };
            return labels[p] || p;
        },
        async toggleExtension(ext) {
            try {
                await fetch("/api/extensions/toggle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: ext.name.toLowerCase(), enabled: !ext.enabled }),
                });
                ext.enabled = !ext.enabled;
                ext.justToggled = true;
            } catch { /* ignore */ }
        },
        async reloadDockge() {
            await fetch("/api/reload", { method: "POST" });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars";

.settings-menu .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: none;
    padding: 0.7em 1em;
    cursor: pointer;
    border-radius: 10px;
    color: $dark-font-color;
    transition: all ease-in-out 0.1s;
    margin-bottom: 2px;
}
.settings-menu .menu-item:hover {
    background: $dark-header-bg;
}
.settings-menu .menu-item.active {
    background: $dark-header-bg;
    border-left: 4px solid $primary;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}
</style>
