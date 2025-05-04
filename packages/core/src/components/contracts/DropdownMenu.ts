import type { DropdownMenuContentProps } from 'reka-ui';

import type { Falsifiable } from '@aerogel/core/utils/types';

export type DropdownMenuOptionData = {
    label: string;
    href?: string;
    route?: string;
    routeParams?: object;
    routeQuery?: object;
    click?: () => unknown;
    class?: string;
};

export interface DropdownMenuProps {
    align?: DropdownMenuContentProps['align'];
    side?: DropdownMenuContentProps['side'];
    readonly options?: Falsifiable<DropdownMenuOptionData>[];
}

export interface DropdownMenuExpose {
    align?: DropdownMenuContentProps['align'];
    side?: DropdownMenuContentProps['side'];
    readonly options?: DropdownMenuOptionData[];
}
