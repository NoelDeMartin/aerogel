<template>
    <div class="flex flex-col gap-2">
        <template v-if="items.length > 0">
            <table
                :id
                class="border-(--border-color) w-full border-collapse border [--border-color:var(--color-slate-300)]"
            >
                <thead>
                    <tr>
                        <th
                            v-for="(column, columnIndex) of columns"
                            :key="columnIndex"
                            class="border-(--border-color) border"
                            :class="{ 'px-4 py-2.5': !column.sortable }"
                            :aria-sort="
                                column.sortable && column.field
                                    ? sortingColumns[column.field]
                                        ? ARIA_SORT[sortingColumns[column.field] as ArraySortDirection]
                                        : 'none'
                                    : undefined
                            "
                        >
                            <Button
                                v-if="column.sortable"
                                variant="ghost"
                                class="w-full justify-start rounded-none px-4 py-2.5"
                                :title="
                                    !(column.field && column.field in sortingColumns)
                                        ? translateWithDefault('pagination.sortAscending', 'Sort ascending')
                                        : sortingColumns[column.field] === 'asc'
                                            ? translateWithDefault('pagination.sortDescending', 'Sort descending')
                                            : translateWithDefault('pagination.unsort', 'Reset sort')
                                "
                                @click="toggleSort(column.field, $event)"
                            >
                                <template v-if="!(column.field && column.field in sortingColumns)">
                                    <IconListBold class="size-4" />
                                    <span class="sr-only">
                                        {{ translateWithDefault('pagination.sortAscending', 'Sort ascending') }}
                                    </span>
                                </template>
                                <template v-else-if="column.field && sortingColumns[column.field] === 'asc'">
                                    <IconSortAscendingBold class="size-4" />
                                    <span class="sr-only">
                                        {{ translateWithDefault('pagination.sortDescending', 'Sort descending') }}
                                    </span>
                                </template>
                                <template v-else>
                                    <IconSortDescendingBold class="size-4" />
                                    <span class="sr-only">
                                        {{ translateWithDefault('pagination.unsort', 'Reset sort') }}
                                    </span>
                                </template>
                                <span class="text-base font-semibold">{{ column.header }}</span>
                            </Button>
                            <span v-else class="text-base font-semibold">
                                {{ column.header }}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, rowIndex) of filteredItems" :key="getItemKey(item, rowIndex)">
                        <td
                            v-for="(column, columnIndex) of columns"
                            :key="columnIndex"
                            class="border-(--border-color) border px-4 py-2.5"
                        >
                            <CellContent :content="column.content" :item />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="pagination" class="flex items-center justify-between">
                <span>
                    {{
                        translateWithDefault('pagination.summary', 'Showing {start} to {end} of {total} {items}', {
                            start: pagination.start,
                            end: pagination.end,
                            total: items.length,
                            items: itemsLabel,
                        })
                    }}
                </span>
                <nav class="flex items-center gap-1" :aria-label="translateWithDefault('pagination.label', 'Pagination')">
                    <Button
                        variant="ghost"
                        :disabled="currentPage === 1"
                        :aria-controls="id"
                        :title="translateWithDefault('pagination.previous', 'Previous')"
                        @click="currentPage = currentPage - 1"
                    >
                        <IconCheveronLeft class="size-4" />
                        <span class="sr-only">{{ translateWithDefault('pagination.previous', 'Previous') }}</span>
                    </Button>
                    <template v-for="(page, pageIndex) of pagination.pages" :key="pageIndex">
                        <Button
                            v-if="typeof page === 'number'"
                            variant="ghost"
                            :aria-controls="id"
                            :class="{ 'font-bold': currentPage === page }"
                            :aria-current="currentPage === page ? 'page' : undefined"
                            @click="currentPage = page"
                        >
                            {{ page }}
                        </Button>
                        <span v-else class="px-2" aria-hidden="true">{{ page }}</span>
                    </template>
                    <Button
                        variant="ghost"
                        :aria-controls="id"
                        :disabled="currentPage === pagination.totalPages"
                        :title="translateWithDefault('pagination.next', 'Next')"
                        @click="currentPage = currentPage + 1"
                    >
                        <IconCheveronRight class="size-4" />
                        <span class="sr-only">{{ translateWithDefault('pagination.next', 'Next') }}</span>
                    </Button>
                </nav>
            </div>
        </template>
        <slot v-else name="empty" />
    </div>
</template>

<script setup lang="ts" generic="T extends object">
import IconSortAscendingBold from '~icons/ph/sort-ascending-bold';
import IconSortDescendingBold from '~icons/ph/sort-descending-bold';
import IconListBold from '~icons/ph/list-bold';
import IconCheveronLeft from '~icons/zondicons/cheveron-left';
import IconCheveronRight from '~icons/zondicons/cheveron-right';

import { arraySorted, arrayWithout, deepGet, isEmpty, isTruthy, range, uuid } from '@noeldemartin/utils';
import { Fragment, computed, ref, shallowRef, watch } from 'vue';
import type { ArraySortDirection, DeepKeyOf } from '@noeldemartin/utils';
import type { VNode, VNodeChild, VNodeNormalizedChildren } from 'vue';

import Button from '@aerogel/core/components/ui/Button.vue';
import { translateWithDefault } from '@aerogel/core/lang/utils';

type SortedColumn = { field: DeepKeyOf<T>; direction: ArraySortDirection };

const ARIA_SORT = {
    asc: 'ascending',
    desc: 'descending',
} as const;

const CellContent = (props: { content: (item: T) => VNodeChild; item: T }) => props.content(props.item);

const {
    items,
    itemKey,
    itemsLabel = 'items',
    itemsPerPage = 10,
} = defineProps<{ items: T[]; itemsLabel?: string; itemKey?: DeepKeyOf<T>; itemsPerPage?: number }>();
const slots = defineSlots<{ default?(): VNode[]; empty?(): VNode[] }>();
const id = `data-table-${uuid()}`;
const currentPage = ref(1);
const sorting = shallowRef<SortedColumn[]>([]);
const sortingColumns = computed(() => Object.fromEntries(sorting.value.map((s) => [s.field, s.direction])));
const normalizedItemsPerPage = computed(() => Math.max(1, itemsPerPage));

const pagination = computed(() => {
    if (items.length <= normalizedItemsPerPage.value) {
        return;
    }

    const totalPages = Math.ceil(items.length / normalizedItemsPerPage.value);

    return {
        totalPages,
        start: (currentPage.value - 1) * normalizedItemsPerPage.value + 1,
        end: Math.min(currentPage.value * normalizedItemsPerPage.value, items.length),
        pages: getPaginationPages(totalPages, currentPage.value),
    };
});

const filteredItems = computed(() => {
    const sortedItems = arraySorted(
        items,
        sorting.value.map(({ field, direction }) => [field, direction] as const),
    );

    return sortedItems.slice(
        (currentPage.value - 1) * normalizedItemsPerPage.value,
        currentPage.value * normalizedItemsPerPage.value,
    );
});

const columns = computed(() =>
    flattenVNodes(slots.default?.())
        .map((slot) => {
            if (!slot.props) {
                return;
            }

            const sortable = 'sortable' in slot.props && slot.props.sortable !== false;

            if (sortable && !slot.props.field) {
                return;
            }

            const children = slot.children;
            const field = slot.props.field ? (String(slot.props.field) as DeepKeyOf<T>) : undefined;

            return {
                field,
                sortable,
                header: String(slot.props.header ?? ''),
                content: hasDefaultSlot(children)
                    ? (item: T) => children.default({ item })
                    : (item: T) => {
                        if (!field) {
                            return '-';
                        }

                        const value = deepGet(item, field);

                        return isEmpty(value) ? '-' : String(value);
                    },
            };
        })
        .filter(isTruthy));

function hasDefaultSlot(
    children: VNodeNormalizedChildren,
): children is { default: (props: { item: T }) => VNodeChild } {
    return (
        typeof children === 'object' &&
        children !== null &&
        'default' in children &&
        typeof children.default === 'function'
    );
}

function getItemKey(item: T, index: number) {
    return String((itemKey ? deepGet(item, itemKey) : index) ?? index);
}

function getPaginationPages(total: number, current: number) {
    if (total <= 7) {
        return range(total).map((index) => index + 1);
    }

    if (current <= 4) {
        return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
        return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
}

function flattenVNodes(vnodes?: VNode[]): VNode[] {
    if (!vnodes) {
        return [];
    }

    return vnodes.flatMap((vnode) => {
        if (vnode.type === Fragment && Array.isArray(vnode.children)) {
            return flattenVNodes(vnode.children as VNode[]);
        }

        return [vnode];
    });
}

function toggleSort(field?: DeepKeyOf<T>, event?: MouseEvent) {
    if (!field) {
        return;
    }

    const existingSort = sorting.value.find((s) => s.field === field);

    if (!existingSort) {
        if (event?.shiftKey) {
            sorting.value = sorting.value.concat([{ field, direction: 'asc' }]);
        } else {
            sorting.value = [{ field, direction: 'asc' }];
        }
    } else if (existingSort.direction === 'asc') {
        if (event?.shiftKey) {
            sorting.value = sorting.value.map((fieldSort) =>
                fieldSort.field === field ? { ...fieldSort, direction: 'desc' } : fieldSort);
        } else {
            sorting.value = [{ field, direction: 'desc' }];
        }
    } else {
        sorting.value = arrayWithout(sorting.value, existingSort);
    }
}

watch(pagination, () => {
    if (!pagination.value) {
        currentPage.value = 1;

        return;
    }

    if (pagination.value.totalPages >= currentPage.value) {
        return;
    }

    currentPage.value = pagination.value.totalPages;
});
</script>
