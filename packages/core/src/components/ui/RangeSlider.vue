<template>
    <HeadlessFormControl
        ref="$controlRef"
        :class="renderedClasses"
        :name="name"
        :label="label"
        :description="description"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event as RangeSliderValue)"
    >
        <div v-if="label || $slots.label" class="flex items-center justify-between text-sm leading-6">
            <HeadlessFormControlLabel :class="renderedLabelClasses">
                <slot name="label" />
            </HeadlessFormControlLabel>
            <span class="font-medium text-gray-600">{{ readout }}</span>
        </div>
        <div class="py-1.5">
            <HeadlessRangeSliderInput
                v-bind="inputAttrs"
                :min="min"
                :max="max"
                :step="step"
                :disabled="disabled"
                class="relative flex w-full touch-none select-none items-center"
                :track-class="renderedTrackClasses"
                :range-class="renderedRangeClasses"
                :thumb-class="renderedThumbClasses"
            />
        </div>
        <div class="flex justify-between text-xs text-gray-400">
            <span>{{ format(min, 'min') }}</span>
            <span>{{ format(max, 'max') }}</span>
        </div>
        <HeadlessFormControlDescription :class="renderedDescriptionClasses" />
        <HeadlessFormControlError :class="renderedErrorClasses" />
    </HeadlessFormControl>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import HeadlessFormControl from '@aerogel/core/components/headless/HeadlessFormControl.vue';
import HeadlessFormControlLabel from '@aerogel/core/components/headless/HeadlessFormControlLabel.vue';
import HeadlessFormControlDescription from '@aerogel/core/components/headless/HeadlessFormControlDescription.vue';
import HeadlessFormControlError from '@aerogel/core/components/headless/HeadlessFormControlError.vue';
import HeadlessRangeSliderInput from '@aerogel/core/components/headless/HeadlessRangeSliderInput.vue';
import { classes } from '@aerogel/core/utils/classes';
import { useInputAttrs } from '@aerogel/core/utils/composition/forms';
import type { FormControlEmits } from '@aerogel/core/components/contracts/FormControl';
import type {
    RangeSliderBound,
    RangeSliderProps,
    RangeSliderValue,
} from '@aerogel/core/components/contracts/RangeSlider';

defineOptions({ inheritAttrs: false });
defineEmits<FormControlEmits<RangeSliderValue>>();

const {
    name,
    label,
    description,
    modelValue,
    formatValue,
    labelClass,
    descriptionClass,
    errorClass,
    trackClass,
    rangeClass,
    thumbClass,
    min = 0,
    max = 100,
    step = 1,
    disabled,
} = defineProps<RangeSliderProps>();

const $control = useTemplateRef('$controlRef');
const [inputAttrs, rootClasses] = useInputAttrs();

const renderedClasses = computed(() =>
    classes('space-y-1', { 'pointer-events-none opacity-50': disabled }, rootClasses.value));
const renderedLabelClasses = computed(() => classes('block text-sm font-medium leading-6 text-gray-900', labelClass));
const renderedDescriptionClasses = computed(() => classes('mt-2 text-sm text-gray-600', descriptionClass));
const renderedErrorClasses = computed(() => classes('mt-2 text-sm text-red-600', errorClass));
const renderedTrackClasses = computed(() =>
    classes('relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100 shadow-inner', trackClass));
const renderedRangeClasses = computed(() =>
    classes(
        'absolute h-full',
        {
            'bg-primary-600': !$control.value?.errors,
            'bg-red-600': !!$control.value?.errors,
        },
        rangeClass,
    ));
const renderedThumbClasses = computed(() =>
    classes(
        'block size-5 cursor-pointer rounded-full border-2 border-primary-600 bg-white shadow-md transition-colors',
        'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-hidden',
        thumbClass,
    ));

const readout = computed(() => {
    const value = $control.value?.value as RangeSliderValue | null | undefined;
    const [start, end] = value ?? [null, null];

    return `${format(start ?? min, 'min')} – ${format(end ?? max, 'max')}`;
});

function format(value: number, bound: RangeSliderBound): string {
    return formatValue ? formatValue(value, bound) : String(value);
}
</script>
