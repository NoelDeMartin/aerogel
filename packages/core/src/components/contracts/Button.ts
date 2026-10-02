import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export type ButtonVariant = 'default' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline' | 'link';
export type ButtonSize = 'default' | 'small' | 'large' | 'icon';
export interface ButtonProps extends PrimitiveProps {
    class?: HTMLAttributes['class'];
    disabled?: boolean;
    href?: string;
    loading?: boolean;
    to?: RouteLocationRaw;
    route?: string;
    routeParams?: object;
    routeQuery?: object;
    size?: ButtonSize;
    submit?: boolean;
    variant?: ButtonVariant;
}

export interface ButtonEmits {
    click: [event: MouseEvent];
}
