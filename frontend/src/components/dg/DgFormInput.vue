<template>
    <input
        :type="type"
        class="dg-form-input"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        v-bind="$attrs"
    />
</template>

<script>
export default {
    name: "DgFormInput",
    inheritAttrs: false,
    props: {
        modelValue: { type: String, default: "" },
        type: { type: String, default: "text" },
        placeholder: { type: String, default: "" },
        disabled: { type: Boolean, default: false },
    },
    emits: ["update:modelValue"],
};
</script>
