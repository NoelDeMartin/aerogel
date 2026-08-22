<template>
    <ComboboxGroup ref="$groupRef" v-bind="$attrs">
        <slot />
    </ComboboxGroup>
</template>

<script setup lang="ts">
import { ComboboxGroup } from 'reka-ui';
import { useTemplateRef, watch } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

const $group = useTemplateRef('$groupRef');
const combobox = injectReactiveOrFail<ComboboxExpose>(
    'combobox',
    '<HeadlessComboboxGroup> must be a child of a <HeadlessCombobox>',
);

watch($group, () => {
    combobox.$group = $group.value?.$el ?? $group.value ?? null;
});
</script>
