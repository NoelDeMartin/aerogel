import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

export type ButtonVariant = 'default' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
export type ButtonSize = 'default' | 'small' | 'large' | 'icon';
export interface ButtonProps extends PrimitiveProps {
    class?: HTMLAttributes['class'];
    disabled?: boolean;
    href?: string;
    route?: string;
    routeParams?: object;
    routeQuery?: object;
    size?: ButtonSize;
    submit?: boolean;
    variant?: ButtonVariant;
}
