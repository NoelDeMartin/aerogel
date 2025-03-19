<template>
    <ListboxOption v-slot="{ active, selected }: ListboxOptionDefaultSlot" as="template">
        <li :class="renderedClass">
            <div :class="renderedInnerClass(active, selected)" :style="active && activeStyle">
                <slot />
            </div>
        </li>
    </ListboxOption>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ListboxOption } from '@headlessui/vue';
import { twMerge } from 'tailwind-merge';

import { mixedProp, stringProp } from '@/utils/vue';

type ListboxOptionDefaultSlot = {
    active: any;
    selected: any;
};

const props = defineProps({
    activeStyle: mixedProp(),
    class: stringProp(),
    innerClass: stringProp(),
});
const renderedClass = computed(() => twMerge('p-1', props.class ?? ''));

// TODO compute instead (need to get selected from ref)
function renderedInnerClass(active: boolean, selected: boolean): string {
    const defaultClass = [
        active ? 'bg-gray-100' : '',
        selected ? 'font-semibold' : 'opacity-50',
        'relative flex max-w-[calc(100vw-2rem)] cursor-pointer select-none items-center truncate rounded-md px-2 py-1',
        '*:truncate',
    ].join(' ');

    return twMerge(defaultClass, props.innerClass ?? '');
}
</script>
