import type { DropdownMenuContentProps } from 'reka-ui';

export type DropdownMenuOption = {
    label: string;
    click: () => unknown;
};

export interface DropdownMenuProps {
    align?: DropdownMenuContentProps['align'];
    options?: DropdownMenuOption[];
}
