<template>
    <AGHeadlessInput
        ref="$input"
        :name="name"
        class="relative flex items-start"
        :class="className"
        :label="label"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="flex h-6 items-center">
            <AGHeadlessInputInput
                v-bind="attrs"
                type="checkbox"
                class="size-4 rounded-xs hover:bg-gray-200"
                :class="{
                    'border-gray-300 text-indigo-600 hover:text-indigo-400 focus:ring-indigo-600': !$input?.errors,
                    'border-red-200 text-red-600 hover:text-red-400 focus:ring-red-600': $input?.errors,
                    [inputClass]: true,
                }"
            />
        </div>
        <div v-if="$slots.default" class="ml-2 text-sm leading-6">
            <AGHeadlessInputLabel class="text-gray-900">
                <slot />
            </AGHeadlessInputLabel>
            <AGHeadlessInputError class="text-sm text-red-600" />
        </div>
    </AGHeadlessInput>
</template>

<script setup lang="ts">
import { AGHeadlessInputLabel, componentRef, stringProp, useInputAttrs, useInputEmits } from '@aerogel/core';
import type { IAGHeadlessInput } from '@aerogel/core';

defineOptions({ inheritAttrs: false });
defineEmits(useInputEmits());
defineProps({
    name: stringProp(),
    label: stringProp(),
    inputClass: stringProp(''),
});

const $input = componentRef<IAGHeadlessInput>();
const [attrs, className] = useInputAttrs();
</script>
