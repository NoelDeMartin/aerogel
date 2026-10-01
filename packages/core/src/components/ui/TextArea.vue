<template>
    <HeadlessFormControl
        :ref="forwardRef"
        :label="label"
        :class="rootClasses"
        v-bind="props"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <HeadlessFormControlLabel :class="renderedLabelClasses" />
        <div :class="renderedWrapperClasses">
            <HeadlessFormControlTextArea v-bind="inputAttrs" :class="renderedInputClasses" />
            <div v-if="$control?.errors" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <IconExclamationSolid class="size-5 text-red-500" />
            </div>
        </div>
        <HeadlessFormControlDescription class="mt-2 text-sm text-gray-600" />
        <HeadlessFormControlError class="mt-2 text-sm text-red-600" />
    </HeadlessFormControl>
</template>

<script setup lang="ts">
import type {
    FormControlEmits,
    FormControlExpose,
    FormControlProps,
} from '@aerogel/core/components/contracts/FormControl';
import HeadlessFormControl from '@aerogel/core/components/headless/HeadlessFormControl.vue';
import HeadlessFormControlDescription from '@aerogel/core/components/headless/HeadlessFormControlDescription.vue';
import HeadlessFormControlError from '@aerogel/core/components/headless/HeadlessFormControlError.vue';
import HeadlessFormControlLabel from '@aerogel/core/components/headless/HeadlessFormControlLabel.vue';
import HeadlessFormControlTextArea from '@aerogel/core/components/headless/HeadlessFormControlTextArea.vue';
import { classes } from '@aerogel/core/utils/classes';
import { useForwardExpose } from '@aerogel/core/utils/composition/expose';
import { useInputAttrs } from '@aerogel/core/utils/composition/forms';
import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';

defineOptions({ inheritAttrs: false });
defineExpose<FormControlExpose<unknown, HTMLTextAreaElement>>();
defineEmits<FormControlEmits>();

const { label, inputClass, labelClass, wrapperClass, ...props } = defineProps<
    FormControlProps & {
        inputClass?: HTMLAttributes['class'];
        labelClass?: HTMLAttributes['class'];
        wrapperClass?: HTMLAttributes['class'];
    }
>();
const { forwardRef, currentRef: $control } = useForwardExpose<InstanceType<typeof HeadlessFormControl>>();
const [inputAttrs, rootClasses] = useInputAttrs();
const renderedWrapperClasses = computed(() =>
    classes('relative rounded-md shadow-2xs', { 'mt-1': label }, wrapperClass),
);
const renderedLabelClasses = computed(() => classes('block text-sm font-medium leading-6 text-gray-900', labelClass));
const renderedInputClasses = computed(() =>
    classes(
        'block w-full rounded-md border-0 py-1.5 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
        {
            'focus:ring-focus': !$control.value?.errors,
            'text-gray-900 shadow-2xs ring-gray-900/10 placeholder:text-gray-400': !$control.value?.errors,
            'pr-10 text-red-900 ring-red-900/10 placeholder:text-red-300 focus:ring-red-500': $control.value?.errors,
        },
        inputClass,
    ),
);
</script>
