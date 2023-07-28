export const Colors = {
    Primary: 'primary',
    Danger: 'danger',
    Clear: 'clear',
} as const;

export type Color = (typeof Colors)[keyof typeof Colors];
