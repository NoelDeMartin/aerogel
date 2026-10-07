import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export const ButtonVariants = ['default', 'secondary', 'danger', 'warning', 'ghost', 'outline', 'link'] as const;
export const ButtonSizes = ['default', 'small', 'large', 'icon'] as const;

export type ButtonVariant = (typeof ButtonVariants)[number];
export type ButtonSize = (typeof ButtonSizes)[number];

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
