<template>
    <AGHeadlessSelect v-bind="props" ref="$select" as="div">
        <AGHeadlessSelectLabel class="block text-sm font-medium leading-6 text-gray-900" />
        <div class="relative" :class="{ 'mt-2': $select?.label }">
            <AGHeadlessSelectButton
                class="relative w-full cursor-default bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                text-class="block truncate"
                :class="{
                    'ring-1 ring-red-500': $select?.errors,
                }"
            >
                <template #icon>
                    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <IconCheveronDown class="h-5 w-5 text-gray-400" />
                    </span>
                </template>
            </AGHeadlessSelectButton>
            <AGHeadlessSelectOptions
                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto border bg-white py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
                <AGHeadlessSelectOption
                    v-for="(option, index) in $select?.options ?? []"
                    :key="index"
                    :value="option.value"
                    class="relative block cursor-default select-none truncate py-2 pl-3 pr-9"
                    selected-class="font-semibold"
                    unselected-class="font-normal"
                    active-class="bg-indigo-600 text-white"
                    inactive-class="text-gray-900"
                />
            </AGHeadlessSelectOptions>
        </div>
        <AGHeadlessSelectError class="mt-2 text-sm text-red-600" />
    </AGHeadlessSelect>
</template>

<script setup lang="ts">
import IconCheveronDown from '~icons/zondicons/cheveron-down';

import { componentRef } from '@/utils/vue';
import { useSelectProps } from '@/components/headless/forms/AGHeadlessSelect';
import type { IAGHeadlessSelect } from '@/components/headless/forms/AGHeadlessSelect';

import AGHeadlessSelect from '../headless/forms/AGHeadlessSelect.vue';
import AGHeadlessSelectButton from '../headless/forms/AGHeadlessSelectButton.vue';
import AGHeadlessSelectError from '../headless/forms/AGHeadlessSelectError.vue';
import AGHeadlessSelectLabel from '../headless/forms/AGHeadlessSelectLabel.vue';
import AGHeadlessSelectOption from '../headless/forms/AGHeadlessSelectOption.vue';
import AGHeadlessSelectOptions from '../headless/forms/AGHeadlessSelectOptions';

const props = defineProps(useSelectProps());
const $select = componentRef<IAGHeadlessSelect>();
</script>
