import type { DropdownMenuContentProps } from 'reka-ui';

export type DropdownMenuOptionData = {
    label: string;
    click: () => unknown;
};

export interface DropdownMenuProps {
    align?: DropdownMenuContentProps['align'];
    side?: DropdownMenuContentProps['side'];
    options?: DropdownMenuOptionData[];
}

export interface DropdownMenuExpose {
    align?: DropdownMenuContentProps['align'];
    side?: DropdownMenuContentProps['side'];
    options?: DropdownMenuOptionData[];
}
