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
                {{ select.renderText(value) }}
            </li>
        </slot>
    </ListboxOption>
</template>

<script setup lang="ts">
import { ListboxOption } from '@headlessui/vue';

import { injectReactiveOrFail, requiredMixedProp, stringProp } from '@/utils/vue';
import type { ComponentProps } from '@/utils/vue';
import type { FormFieldValue } from '@/forms/Form';

import type { IAGHeadlessSelect } from './AGHeadlessSelect';

defineProps({
    value: requiredMixedProp<FormFieldValue>(),
    selectedClass: stringProp(),
    unselectedClass: stringProp(),
    activeClass: stringProp(),
    inactiveClass: stringProp(),
});

const select = injectReactiveOrFail<IAGHeadlessSelect>(
    'select',
    '<AGHeadlessSelectOption> must be a child of a <AGHeadlessSelect>',
);
</script>
