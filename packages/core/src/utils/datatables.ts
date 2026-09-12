import type { MaybeRefOrGetter, VNodeChild } from 'vue';
import { defineComponent, h, toValue } from 'vue';
import type { ComponentProps } from 'vue-component-type-helpers';

import DataTable from '@aerogel/core/components/ui/DataTable.vue';
import DataTableColumn from '@aerogel/core/components/ui/DataTableColumn.vue';

import type { DeepKeyOf } from '@noeldemartin/utils';

type TableComponent<T extends object> = typeof DataTable &
    (new () => {
        $props: Omit<ComponentProps<typeof DataTable>, 'items'> & { items?: T[] };
    });
type TableColumnComponent<T extends object> = typeof DataTableColumn &
    (new () => {
        $props: Omit<ComponentProps<typeof DataTableColumn>, 'field'> & { field?: DeepKeyOf<T> };
        $slots: { default?: (props: { item: T }) => VNodeChild };
    });

export function useDataTable<T extends object>(
    items: MaybeRefOrGetter<T[]>,
): { Table: TableComponent<T>; TableColumn: TableColumnComponent<T> } {
    const Table = defineComponent({
        inheritAttrs: false,
        setup(_, { attrs, slots }) {
            return () => h(DataTable, { items: toValue(items), ...attrs }, slots);
        },
    }) as unknown as TableComponent<T>;

    return {
        Table,
        TableColumn: DataTableColumn as unknown as TableColumnComponent<T>,
    };
}
