import type { HTMLAttributes } from 'vue';

import type { NumberRange } from '@aerogel/core/forms/schemas';

import type { FormControlProps } from './FormControl';

export type RangeSliderValue = NumberRange;
export type RangeSliderBound = 'min' | 'max';

export interface RangeSliderInputProps {
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    trackClass?: HTMLAttributes['class'];
    rangeClass?: HTMLAttributes['class'];
    thumbClass?: HTMLAttributes['class'];
}

export interface RangeSliderProps extends FormControlProps<RangeSliderValue>, RangeSliderInputProps {
    formatValue?: (value: number, bound: RangeSliderBound) => string;
    labelClass?: HTMLAttributes['class'];
    descriptionClass?: HTMLAttributes['class'];
    errorClass?: HTMLAttributes['class'];
}
