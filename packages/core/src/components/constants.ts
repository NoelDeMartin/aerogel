export const Colors = {
    Primary: 'primary',
    Secondary: 'secondary',
    Danger: 'danger',
    Clear: 'clear',
} as const;

export type Color = (typeof Colors)[keyof typeof Colors];
