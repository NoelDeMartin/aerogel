<template>
    <ComboboxEmpty v-bind="$attrs">
        <slot />
    </ComboboxEmpty>
</template>

<script setup lang="ts">
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { ComboboxEmpty } from 'reka-ui';

injectReactiveOrFail<ComboboxExpose>('combobox', '<HeadlessComboboxEmpty> must be a child of a <HeadlessCombobox>');
</script>
