<template>
    <ListboxOption v-slot="{ active, selected, disabled }: ComponentProps" :value="value" as="template">
        <slot :active="active" :selected="selected" :disabled="disabled">
            <li
                :class="{
                    [activeClass ?? 'active']: active,
                    [inactiveClass ?? 'inactive']: !active,
                    [selectedClass ?? 'selected']: selected,
                    [unselectedClass ?? 'unselected']: !selected,
                }"
            >
                {{ option?.text }}
            </li>
        </slot>
    </ListboxOption>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ListboxOption } from '@headlessui/vue';

import { injectReactiveOrFail, requiredMixedProp, stringProp } from '@/utils/vue';
import type { ComponentProps } from '@/utils/vue';

import type { IAGHeadlessSelect, IAGSelectOptionValue } from './AGHeadlessSelect';

const props = defineProps({
    value: requiredMixedProp<IAGSelectOptionValue>(),
    selectedClass: stringProp(),
    unselectedClass: stringProp(),
    activeClass: stringProp(),
    inactiveClass: stringProp(),
});
const select = injectReactiveOrFail<IAGHeadlessSelect>(
    'select',
    '<AGHeadlessSelectOption> must be a child of a <AGHeadlessSelect>',
);
const option = computed(() => select.options.find((selectOption) => selectOption.value === props.value));
</script>
