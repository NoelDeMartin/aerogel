import type { ObjectValues } from '@noeldemartin/utils';

export const AGHeadlessInputTypes = {
    Text: 'text',
} as const;

export type AGHeadlessInputType = ObjectValues<typeof AGHeadlessInputTypes>;
