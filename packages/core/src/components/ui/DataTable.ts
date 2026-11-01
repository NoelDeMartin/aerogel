import type { ArraySortDirection, DeepKeyOf } from '@noeldemartin/utils';

export type SortedColumn<T extends object = Record<string, unknown>> = {
    field: DeepKeyOf<T>;
    direction: ArraySortDirection;
};
