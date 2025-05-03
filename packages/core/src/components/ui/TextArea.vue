<template>
    <HeadlessInput
        ref="$inputRef"
        :label="label"
        :class="rootClasses"
        v-bind="props"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <HeadlessInputLabel class="block text-sm leading-6 font-medium text-gray-900" />
        <div :class="renderedWrapperClasses">
            <HeadlessInputTextArea v-bind="inputAttrs" :class="renderedInputClasses" />
            <div v-if="$input?.errors" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <IconExclamationSolid class="size-5 text-red-500" />
            </div>
        </div>
        <HeadlessInputDescription class="mt-2 text-sm text-gray-600" />
        <HeadlessInputError class="mt-2 text-sm text-red-600" />
    </HeadlessInput>
</template>

<script setup lang="ts">
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';

import { computed, useTemplateRef } from 'vue';
import type { HTMLAttributes } from 'vue';

import HeadlessInput from '@aerogel/core/components/headless/HeadlessInput.vue';
import HeadlessInputLabel from '@aerogel/core/components/headless/HeadlessInputLabel.vue';
import HeadlessInputTextArea from '@aerogel/core/components/headless/HeadlessInputTextArea.vue';
import HeadlessInputDescription from '@aerogel/core/components/headless/HeadlessInputDescription.vue';
import HeadlessInputError from '@aerogel/core/components/headless/HeadlessInputError.vue';
import { classes } from '@aerogel/core/utils/classes';
import { useInputAttrs } from '@aerogel/core/utils/composition/forms';
import type { InputEmits, InputProps } from '@aerogel/core/components/contracts/Input';

defineOptions({ inheritAttrs: false });
defineEmits<InputEmits>();
const { label, inputClass, wrapperClass, ...props } = defineProps<
    InputProps & { inputClass?: HTMLAttributes['class']; wrapperClass?: HTMLAttributes['class'] }
>();
const $input = useTemplateRef('$inputRef');
const [inputAttrs, rootClasses] = useInputAttrs();
const renderedWrapperClasses = computed(() =>
    classes('relative rounded-md shadow-2xs', { 'mt-1': label }, wrapperClass));
const renderedInputClasses = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'block w-full rounded-md border-0 py-1.5 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
        {
            'focus:ring-primary-600': !$input.value?.errors,
            'text-gray-900 shadow-2xs ring-gray-900/10 placeholder:text-gray-400': !$input.value?.errors,
            'pr-10 text-red-900 ring-red-900/10 placeholder:text-red-300 focus:ring-red-500': $input.value?.errors,
        },
        inputClass,
    ));
</script>
