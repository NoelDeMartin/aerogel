<template>
    <AGHeadlessSelect v-bind="props" ref="$select" as="div">
        <AGHeadlessSelectLabel class="block text-sm font-medium leading-6 text-gray-900" />
        <div class="relative" :class="{ 'mt-2': $select?.label }">
            <AGHeadlessSelectButton
                class="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                text-class="block truncate"
                :class="{
                    'ring-1 ring-red-500': $select?.errors,
                }"
            >
                <template #icon>
                    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <i-zondicons-cheveron-down class="h-5 w-5 text-gray-400" />
                    </span>
                </template>
            </AGHeadlessSelectButton>
            <AGHeadlessSelectOptions
                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
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
import { componentRef, useSelectProps } from '@aerogel/core';
import type { IAGHeadlessSelect } from '@aerogel/core';

const props = defineProps(useSelectProps());
const $select = componentRef<IAGHeadlessSelect>();
</script>
