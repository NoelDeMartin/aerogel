<template>
    <AGHeadlessInput ref="$input" v-bind="inputProps" :class="className">
        <AGHeadlessInputLabel class="block text-sm font-medium leading-6 text-gray-900" />
        <div class="relative rounded-md shadow-sm" :class="{ 'mt-1': label, [wrapperClass]: true }">
            <AGHeadlessInputInput
                v-bind="attrs"
                class="block w-full rounded-md border-0 py-1.5 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                :class="{
                    'text-gray-900 shadow-sm ring-gray-300 placeholder:text-gray-400 ': !$input?.errors,
                    'hover:ring-1 hover:ring-inset hover:ring-indigo-400 focus:ring-indigo-600': !$input?.errors,
                    'pr-10 text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500': $input?.errors,
                    [inputClass]: true,
                }"
            />
            <div v-if="$input?.errors" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <i-zondicons-exclamation-solid class="h-5 w-5 text-red-500" />
            </div>
        </div>
        <AGHeadlessInputError class="mt-2 text-sm text-red-600" />
    </AGHeadlessInput>
</template>

<script setup lang="ts">
import { componentRef, extractInputProps, stringProp, useInputAttrs, useInputProps } from '@aerogel/core';
import type { IAGHeadlessInput } from '@aerogel/core';

defineOptions({ inheritAttrs: false });

const props = defineProps({
    ...useInputProps(),
    inputClass: stringProp(''),
    wrapperClass: stringProp(''),
});

const $input = componentRef<IAGHeadlessInput>();
const inputProps = extractInputProps(props);
const [attrs, className] = useInputAttrs();
</script>
