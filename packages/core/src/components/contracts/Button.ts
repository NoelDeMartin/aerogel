import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

export type IButtonVariants = 'default' | 'secondary' | 'destructive' | 'ghost' | 'link';
export type IButtonSizes = 'default' | 'sm' | 'icon';
export interface IButtonProps extends PrimitiveProps {
    class?: HTMLAttributes['class'];
    link?: string;
    route?: string;
    routeParams?: object;
    routeQuery?: object;
    size?: IButtonSizes;
    submit?: boolean;
    variant?: IButtonVariants;
}
