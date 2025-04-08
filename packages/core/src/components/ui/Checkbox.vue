<template>
    <HeadlessInput
        ref="$input"
        :class="renderedClasses"
        v-bind="props"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="flex h-6 items-center">
            <HeadlessInputInput v-bind="inputAttrs" type="checkbox" :class="renderedInputClasses" />
        </div>
        <div v-if="$slots.default" :class="renderedLabelClasses">
            <HeadlessInputLabel class="text-gray-900">
                <slot />
            </HeadlessInputLabel>
            <HeadlessInputError class="text-red-600" />
        </div>
        <div v-else-if="label" :class="renderedLabelClasses">
            <HeadlessInputLabel class="text-gray-900" />
            <HeadlessInputError class="text-red-600" />
        </div>
    </HeadlessInput>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import type { HTMLAttributes } from 'vue';

import HeadlessInput from '@aerogel/core/components/headless/HeadlessInput.vue';
import HeadlessInputError from '@aerogel/core/components/headless/HeadlessInputError.vue';
import HeadlessInputInput from '@aerogel/core/components/headless/HeadlessInputInput.vue';
import HeadlessInputLabel from '@aerogel/core/components/headless/HeadlessInputLabel.vue';
import { classes } from '@aerogel/core/components/utils';
import { useInputAttrs } from '@aerogel/core/utils/composition/forms';
import type { InputEmits, InputProps } from '@aerogel/core/components/contracts/Input';

defineOptions({ inheritAttrs: false });
defineEmits<InputEmits>();

const { inputClass, labelClass, ...props } = defineProps<
    InputProps & { inputClass?: HTMLAttributes['class']; labelClass?: HTMLAttributes['class'] }
>();

const $input = useTemplateRef('$input');
const [inputAttrs, rootClasses] = useInputAttrs();
const renderedClasses = computed(() => classes('relative flex items-start', rootClasses.value));
const renderedInputClasses = computed(() =>
    classes(
        'size-4 rounded text-primary hover:bg-gray-200 checked:hover:bg-primary/80 checked:border-0',
        {
            'border-gray-300 focus:ring-primary': !$input.value?.errors,
            'border-red-400 border-2 focus:ring-red-600': $input.value?.errors,
        },
        inputClass,
    ));
const renderedLabelClasses = computed(() => classes('ml-2 text-sm leading-6', labelClass));
</script>
