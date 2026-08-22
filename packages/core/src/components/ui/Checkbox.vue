<template>
    <HeadlessFormControl
        ref="$controlRef"
        :class="renderedClasses"
        v-bind="props"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="flex h-6 items-center">
            <HeadlessFormControlInput v-bind="inputAttrs" type="checkbox" :class="renderedInputClasses" />
        </div>
        <div v-if="$slots.default" :class="renderedLabelClasses">
            <HeadlessFormControlLabel class="text-gray-900">
                <slot />
            </HeadlessFormControlLabel>
            <HeadlessFormControlError class="text-red-600" />
        </div>
        <div v-else-if="label" :class="renderedLabelClasses">
            <HeadlessFormControlLabel class="text-gray-900" />
            <HeadlessFormControlError class="text-red-600" />
        </div>
    </HeadlessFormControl>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import type { HTMLAttributes } from 'vue';

import HeadlessFormControl from '@aerogel/core/components/headless/HeadlessFormControl.vue';
import HeadlessFormControlError from '@aerogel/core/components/headless/HeadlessFormControlError.vue';
import HeadlessFormControlInput from '@aerogel/core/components/headless/HeadlessFormControlInput.vue';
import HeadlessFormControlLabel from '@aerogel/core/components/headless/HeadlessFormControlLabel.vue';
import { classes } from '@aerogel/core/utils/classes';
import { useInputAttrs } from '@aerogel/core/utils/composition/forms';
import type { FormControlEmits, FormControlProps } from '@aerogel/core/components/contracts/FormControl';

defineOptions({ inheritAttrs: false });
defineEmits<FormControlEmits>();

const { inputClass, labelClass, ...props } = defineProps<
    FormControlProps & { inputClass?: HTMLAttributes['class']; labelClass?: HTMLAttributes['class'] }
>();

const $control = useTemplateRef('$controlRef');
const [inputAttrs, rootClasses] = useInputAttrs();
const renderedClasses = computed(() => classes('relative flex items-start', rootClasses.value));
const renderedInputClasses = computed(() =>
    classes(
        'size-4 rounded text-primary-600 not-checked:hover:bg-gray-200 checked:hover:text-primary-500 checked:border-0',
        {
            'border-gray-300 focus:ring-primary-600': !$control.value?.errors,
            'border-red-400 border-2 focus:ring-red-600': $control.value?.errors,
        },
        inputClass,
    ));
const renderedLabelClasses = computed(() => classes('ml-2 text-sm leading-6', labelClass));
</script>
