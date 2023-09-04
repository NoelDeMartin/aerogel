<template>
    <AGHeadlessInput
        ref="$input"
        class="relative flex flex-col items-center"
        :class="className"
        :name="name"
    >
        <AGHeadlessInputInput
            v-bind="attrs"
            class="block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            :class="{
                'ring-1 ring-red-500': $input?.errors,
            }"
        />
        <div class="absolute bottom-0 left-0 translate-y-full">
            <AGHeadlessInputError class="mt-1 text-sm text-red-500" />
        </div>
    </AGHeadlessInput>
</template>

<script setup lang="ts">
import { componentRef, stringProp } from '@/utils/vue';

import { useInputAttrs } from '@/utils';
import type { IAGHeadlessInput } from '@/components/headless/forms/AGHeadlessInput';

import AGHeadlessInput from '../headless/forms/AGHeadlessInput.vue';
import AGHeadlessInputInput from '../headless/forms/AGHeadlessInputInput.vue';
import AGHeadlessInputError from '../headless/forms/AGHeadlessInputError.vue';

defineProps({ name: stringProp() });
defineOptions({ inheritAttrs: false });

const $input = componentRef<IAGHeadlessInput>();
const [attrs, className] = useInputAttrs();
</script>
