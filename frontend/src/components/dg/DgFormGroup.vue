<template>
    <div class="dg-form-group">
        <label v-if="label" class="dg-form-label" :for="inputId">{{ label }}</label>
        <slot />
        <span v-if="helpText" class="dg-form-help">{{ helpText }}</span>
    </div>
</template>

<script>
let idCounter = 0;
export default {
    name: "DgFormGroup",
    props: {
        label: { type: String, default: "" },
        helpText: { type: String, default: "" },
    },
    data() { return { inputId: "dg-" + ++idCounter }; },
};
</script>
