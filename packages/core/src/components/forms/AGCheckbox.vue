<template>
    <AGHeadlessInput ref="$input" :name="name" class="flex">
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
import { componentRef, stringProp } from '@/utils/vue';

import type { IAGHeadlessInput } from '@/components/headless/forms/AGHeadlessInput';

import AGHeadlessInput from '../headless/forms/AGHeadlessInput.vue';
import AGHeadlessInputError from '../headless/forms/AGHeadlessInputError.vue';
import AGHeadlessInputInput from '../headless/forms/AGHeadlessInputInput.vue';
import AGHeadlessInputLabel from '../headless/forms/AGHeadlessInputLabel.vue';

defineProps({ name: stringProp() });
defineOptions({ inheritAttrs: false });

const $input = componentRef<IAGHeadlessInput>();
</script>
