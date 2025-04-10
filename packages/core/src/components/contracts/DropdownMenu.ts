import type { DropdownMenuContentProps } from 'reka-ui';

import type { Falsifiable } from '@aerogel/core/utils/types';

export type DropdownMenuOptionData = {
    label: string;
    click: () => unknown;
};

export interface DropdownMenuProps {
    align?: DropdownMenuContentProps['align'];
    side?: DropdownMenuContentProps['side'];
    options?: Falsifiable<DropdownMenuOptionData>[];
}

export interface DropdownMenuExpose {
    align?: DropdownMenuContentProps['align'];
    side?: DropdownMenuContentProps['side'];
    options?: DropdownMenuOptionData[];
}
