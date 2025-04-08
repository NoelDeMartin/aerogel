export type DropdownMenuOption = {
    label: string;
    click: () => unknown;
};

export interface DropdownMenuProps {
    options?: DropdownMenuOption[];
}
