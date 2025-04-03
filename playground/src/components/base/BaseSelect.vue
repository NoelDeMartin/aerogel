<template>
    <AGHeadlessSelect v-bind="props" ref="$select" as="div">
        <AGHeadlessSelectLabel class="block text-sm leading-6 font-medium text-gray-900" />
        <div class="relative" :class="{ 'mt-2': $select?.label }">
            <AGHeadlessSelectButton
                class="relative w-full cursor-default rounded-md bg-white py-1.5 pr-10 pl-3 text-left text-gray-900 shadow-2xs ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                text-class="block truncate"
                :class="{
                    'ring-1 ring-red-500': $select?.errors,
                }"
            >
                <template #icon>
                    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <i-zondicons-cheveron-down class="size-5 text-gray-400" />
                    </span>
                </template>
            </AGHeadlessSelectButton>
            <AGHeadlessSelectOptions
                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden"
            >
                <AGHeadlessSelectOption
                    v-for="(option, index) in $select?.options ?? []"
                    :key="index"
                    :value="option"
                    class="relative block cursor-default truncate py-2 pr-9 pl-3 select-none"
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
