<template>
    <AGHeadlessSelect
        v-bind="props"
        ref="$select"
        as="div"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="relative" :class="{ 'mt-2': $select?.label }">
            <AGHeadlessSelectTrigger
                class="relative w-full cursor-default bg-white py-1.5 pr-10 pl-3 text-left text-gray-900 ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                text-class="block truncate"
                :class="{
                    'ring-1 ring-red-500': $select?.errors,
                }"
            >
                <template #icon>
                    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <IconCheveronDown class="size-5 text-gray-400" />
                    </span>
                </template>
            </AGHeadlessSelectTrigger>
            <AGHeadlessSelectOptions
                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto border border-gray-300 bg-white py-1 text-base ring-1 ring-black/5 focus:outline-hidden"
            >
                <AGHeadlessSelectOption
                    v-for="(option, index) in $select?.options ?? []"
                    :key="index"
                    :value="option"
                    class="relative block cursor-default truncate py-2 pr-9 pl-3 text-gray-900 select-none data-[highlighted]:bg-indigo-600 data-[highlighted]:text-white data-[state=checked]:font-semibold data-[state=unchecked]:font-normal"
                />
            </AGHeadlessSelectOptions>
        </div>
        <AGHeadlessSelectError class="mt-2 text-sm text-red-600" />
    </AGHeadlessSelect>
</template>

<script setup lang="ts">
import IconCheveronDown from '~icons/zondicons/cheveron-down';

import { componentRef } from '@aerogel/core/utils/vue';
import { useSelectEmits, useSelectProps } from '@aerogel/core/components/headless/forms/AGHeadlessSelect';
import type { IAGHeadlessSelect } from '@aerogel/core/components/headless/forms/AGHeadlessSelect';

import AGHeadlessSelect from '../headless/forms/AGHeadlessSelect.vue';
import AGHeadlessSelectTrigger from '../headless/forms/AGHeadlessSelectTrigger.vue';
import AGHeadlessSelectError from '../headless/forms/AGHeadlessSelectError.vue';
import AGHeadlessSelectOption from '../headless/forms/AGHeadlessSelectOption.vue';
import AGHeadlessSelectOptions from '../headless/forms/AGHeadlessSelectOptions.vue';

defineEmits(useSelectEmits());

const props = defineProps(useSelectProps());
const $select = componentRef<IAGHeadlessSelect>();
</script>
