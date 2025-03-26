<template>
    <AGHeadlessInput
        ref="$input"
        :name="name"
        class="flex"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <AGHeadlessInputInput
            v-bind="$attrs"
            type="checkbox"
            :class="{
                'text-indigo-600 focus:ring-indigo-600': !$input?.errors,
                'border-red-200 text-red-600 focus:ring-red-600': $input?.errors,
            }"
        />

        <div class="ml-2">
            <AGHeadlessInputLabel v-if="$slots.default">
                <slot />
            </AGHeadlessInputLabel>
            <AGHeadlessInputError class="text-sm text-red-600" />
        </div>
    </AGHeadlessInput>
</template>

<script setup lang="ts">
import { componentRef, stringProp } from '@aerogel/core/utils/vue';

import { useInputEmits } from '@aerogel/core/components/headless/forms/AGHeadlessInput';
import type { IAGHeadlessInput } from '@aerogel/core/components/headless/forms/AGHeadlessInput';

import AGHeadlessInput from '../headless/forms/AGHeadlessInput.vue';
import AGHeadlessInputError from '../headless/forms/AGHeadlessInputError.vue';
import AGHeadlessInputInput from '../headless/forms/AGHeadlessInputInput.vue';
import AGHeadlessInputLabel from '../headless/forms/AGHeadlessInputLabel.vue';

defineProps({ name: stringProp() });
defineOptions({ inheritAttrs: false });
defineEmits(useInputEmits());

const $input = componentRef<IAGHeadlessInput>();
</script>
