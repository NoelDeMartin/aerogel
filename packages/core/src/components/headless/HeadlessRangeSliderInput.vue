<template>
    <SliderRoot
        :model-value="sliderValue"
        :min
        :max
        :step
        :disabled
        @update:model-value="update($event)"
    >
        <SliderTrack :class="trackClass">
            <SliderRange :class="rangeClass" />
        </SliderTrack>
        <SliderThumb
            :id="formControl.id"
            ref="$thumbRef"
            :class="thumbClass"
            :aria-label="minimumLabel"
            :aria-invalid="formControl.errors ? 'true' : 'false'"
            :aria-describedby="describedBy"
        />
        <SliderThumb
            :class="thumbClass"
            :aria-label="maximumLabel"
            :aria-invalid="formControl.errors ? 'true' : 'false'"
            :aria-describedby="describedBy"
        />
    </SliderRoot>
</template>

<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui';
import { computed, useTemplateRef, watchEffect } from 'vue';
import type { ComponentPublicInstance } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { onFormFocus } from '@aerogel/core/utils/composition/forms';
import { translateWithDefault } from '@aerogel/core/lang';
import type { FormControlExpose } from '@aerogel/core/components/contracts/FormControl';
import type { RangeSliderInputProps, RangeSliderValue } from '@aerogel/core/components/contracts/RangeSlider';

const { min = 0, max = 100, step = 1 } = defineProps<RangeSliderInputProps>();
const $thumb = useTemplateRef<ComponentPublicInstance>('$thumbRef');
const formControl = injectReactiveOrFail<FormControlExpose<RangeSliderValue | null>>(
    'form-control',
    '<HeadlessRangeSliderInput> must be a child of a <HeadlessFormControl>',
);

const sliderValue = computed(() => {
    const [start, end] = (formControl.value as RangeSliderValue | null) ?? [null, null];

    return [start ?? min, end ?? max];
});
const minimumLabel = computed(() => {
    const minimum = translateWithDefault('ui.minimum', 'Minimum');

    return formControl.label ? `${formControl.label} (${minimum})` : minimum;
});
const maximumLabel = computed(() => {
    const maximum = translateWithDefault('ui.maximum', 'Maximum');

    return formControl.label ? `${formControl.label} (${maximum})` : maximum;
});
const describedBy = computed(() => {
    if (formControl.errors) {
        return `${formControl.id}-error`;
    }

    return formControl.description ? `${formControl.id}-description` : undefined;
});

function update(value?: number[]): void {
    if (!value) {
        return;
    }

    const [start = min, end = max] = value;

    formControl.update([start <= min ? null : start, end >= max ? null : end]);
}

onFormFocus(formControl, () => $thumb.value?.$el?.focus());
watchEffect(() => (formControl.$control = $thumb.value?.$el ?? null));
</script>
