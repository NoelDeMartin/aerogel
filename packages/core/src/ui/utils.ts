export const MOBILE_BREAKPOINT = 768;

export const Layouts = {
    Mobile: 'mobile',
    Desktop: 'desktop',
} as const;

export type Layout = (typeof Layouts)[keyof typeof Layouts];

export function getCurrentLayout(): Layout {
    if (globalThis.innerWidth > MOBILE_BREAKPOINT) {
        return Layouts.Desktop;
    }

    return Layouts.Mobile;
}
