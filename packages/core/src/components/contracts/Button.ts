import type { Color } from '@/components/constants';

import type { HasElement } from './shared';

export interface IButton extends HasElement {}

export interface IButtonProps {
    as: object | null;
    color: Color;
    disabled: boolean;
    href: string | null;
    route: string | null;
    routeParams: object;
    routeQuery: object;
    submit: boolean;
    url: string | null;
}
