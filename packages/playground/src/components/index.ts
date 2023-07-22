export const Colors = {
    Primary: 'primary',
    Danger: 'danger',
} as const;

export type Color = (typeof Colors)[keyof typeof Colors];
