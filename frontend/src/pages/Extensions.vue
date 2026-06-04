<template>
    <div>
        <div v-if="extensions.length === 0" class="text-muted">No extensions available.</div>

        <div v-else class="row">
            <!-- Extension list column (matches Settings sidebar style) -->
            <div class="col-lg-4 col-md-5 mb-3 settings-menu">
                <button
                    v-for="ext in extensions"
                    :key="ext.name"
                    class="menu-item w-100 text-start"
                    :class="{ active: selected === ext.name }"
                    @click="selected = ext.name"
                >
                    <span class="me-2" :class="ext.enabled ? 'text-success' : 'text-muted'">
                        <font-awesome-icon v-if="ext.enabled" icon="check-circle" />
                        <font-awesome-icon v-else icon="times-circle" />
                    </span>
                    <span class="flex-grow-1">{{ ext.name }}</span>
                    <span class="badge" :class="ext.enabled ? 'bg-success' : 'bg-secondary'">
                        {{ ext.enabled ? 'On' : 'Off' }}
                    </span>
                </button>
            </div>

            <!-- Extension detail column -->
            <div class="col-lg-8 col-md-7">
                <div v-if="!selected" class="text-muted">Select an extension.</div>

                <div v-else class="shadow-box">
                    <h5>{{ detail.name }}</h5>
                    <p class="text-muted small">{{ detail.description }}</p>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Status</label>
                        <div class="d-flex align-items-center gap-2">
                            <button
                                class="btn"
                                :class="detail.enabled ? 'btn-danger' : 'btn-primary'"
                                @click="toggleExtension(detail)"
                            >
                                {{ detail.enabled ? 'Disable' : 'Enable' }}
                            </button>
                            <span v-if="detail.justToggled" class="text-warning small">
                                <font-awesome-icon icon="sync-alt" class="me-1" />Reload required
                                <button class="btn btn-sm btn-outline-warning ms-2" @click="reloadDockge">Reload Now</button>
                            </span>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Permissions</label>
                        <ul class="list-unstyled mb-0">
                            <li v-for="p in detail.permissions" :key="p" class="small py-1">
                                <font-awesome-icon icon="check" class="text-success me-1" /> {{ permissionLabel(p) }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="detail.enabled && detail.capabilities.hooks" class="mb-3">
                        <label class="form-label fw-bold">Hooks</label>
                        <div class="small text-muted">
                            <span v-for="h in detail.capabilities.hooks" :key="h" class="me-2 badge bg-secondary">{{ h }}</span>
                        </div>
                    </div>

                    <ExtensionSlot v-if="detail.enabled" slot-name="settings-pages" :extension-name="selected" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return { extensions: [], selected: null, justToggled: {} };
    },
    computed: {
        detail() {
            return this.extensions.find(e => e.name === this.selected) || { permissions: [], capabilities: {} };
        },
    },
    mounted() { this.load(); },
    methods: {
        async load() {
            try {
                const res = await fetch("/api/extensions/list");
                this.extensions = await res.json();
            } catch { /* ignore */ }
        },
        permissionLabel(p) {
            const map = {
                "stack:read": "Read stack info",
                "stack:badge": "Show badges on stacks",
                "stack:actions": "Add action buttons to stacks",
                "stack:lifecycle:notify": "Receive lifecycle notifications",
                "settings:page": "Add settings page",
                "home:widget": "Add home dashboard widget",
                "nav:link": "Add navigation link",
            };
            return map[p] || p;
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
