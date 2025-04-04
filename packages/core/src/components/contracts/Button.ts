import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

export type IButtonVariants = 'default' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
export type IButtonSizes = 'default' | 'small' | 'large' | 'icon';
export interface IButtonProps extends PrimitiveProps {
    class?: HTMLAttributes['class'];
    href?: string;
    route?: string;
    routeParams?: object;
    routeQuery?: object;
    size?: IButtonSizes;
    submit?: boolean;
    variant?: IButtonVariants;
}
