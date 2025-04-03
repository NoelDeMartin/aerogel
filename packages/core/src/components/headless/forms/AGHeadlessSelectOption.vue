<template>
    <SelectItem :value="value" as="template">
        <SelectItemText>
            <slot>
                {{ select.renderText(value) }}
            </slot>
        </SelectItemText>
    </SelectItem>
</template>

<script setup lang="ts">
import { SelectItem, SelectItemText } from 'reka-ui';

import { injectReactiveOrFail, requiredMixedProp, stringProp } from '@aerogel/core/utils/vue';

import type { IAGHeadlessSelect } from './AGHeadlessSelect';

defineProps({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: requiredMixedProp<any>(),
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
