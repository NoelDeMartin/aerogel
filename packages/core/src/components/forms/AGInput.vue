<template>
    <AGHeadlessInput
        ref="$input"
        class="relative flex flex-col items-center"
        :class="className"
        v-bind="props"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <AGHeadlessInputLabel class="sr-only" />
        <AGHeadlessInputInput
            v-bind="attrs"
            class="block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            :class="{
                'ring-1 ring-red-500': $input?.errors,
            }"
        />
        <AGHeadlessInputDescription />
        <div class="absolute bottom-0 left-0 translate-y-full">
            <AGHeadlessInputError class="mt-1 text-sm text-red-500" />
        </div>
    </AGHeadlessInput>
</template>

<script setup lang="ts">
import { componentRef } from '@aerogel/core/utils/vue';
import { useInputAttrs } from '@aerogel/core/utils/composition/forms';
import { useInputEmits, useInputProps } from '@aerogel/core/components/headless/forms/AGHeadlessInput';
import type { IAGHeadlessInput } from '@aerogel/core/components/headless/forms/AGHeadlessInput';

import AGHeadlessInput from '../headless/forms/AGHeadlessInput.vue';
import AGHeadlessInputDescription from '../headless/forms/AGHeadlessInputDescription.vue';
import AGHeadlessInputError from '../headless/forms/AGHeadlessInputError.vue';
import AGHeadlessInputInput from '../headless/forms/AGHeadlessInputInput.vue';
import AGHeadlessInputLabel from '../headless/forms/AGHeadlessInputLabel.vue';

defineOptions({ inheritAttrs: false });
defineEmits(useInputEmits());

const props = defineProps(useInputProps());
const $input = componentRef<IAGHeadlessInput>();
const [attrs, className] = useInputAttrs();
</script>
