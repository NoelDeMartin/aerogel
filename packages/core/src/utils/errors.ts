import { toString } from '@noeldemartin/utils';

export function toError(value: unknown): Error {
    if (value instanceof Error) {
        return value;
    }

    return new Error(toString(value));
}
