import type { Ref } from 'vue';

// TODO build select using AGHeadlessSelect

export interface ISelect {
    $button: Readonly<Ref<HTMLElement | undefined>>;
    $menu: Readonly<Ref<HTMLElement | undefined>>;
}

export interface __ISelect extends ISelect {
    __setButtonElement(element?: HTMLElement): void;
    __setMenuElement(element?: HTMLElement): void;
}

export interface ISelectProps {
    name: string | null;
    label: string | null;
    options: Record<string, string> | null;
    optionsClass: string | null;
}
