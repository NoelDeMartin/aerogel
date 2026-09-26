import type { HTMLAttributes } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import type { FormControlProps } from './FormControl';

export type RangeSliderValue = [Nullable<number>, Nullable<number>];
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
