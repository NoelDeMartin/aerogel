import type { Nullable } from '@noeldemartin/utils';

export const MINUTE_MILLISECONDS = 60000;

export function getLocalTimezoneOffset(date?: Nullable<Date>): number {
    return -(date ?? new Date()).getTimezoneOffset() * -MINUTE_MILLISECONDS;
}
