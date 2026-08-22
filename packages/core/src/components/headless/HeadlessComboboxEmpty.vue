<template>
    <ComboboxEmpty v-bind="$attrs">
        <slot />
    </ComboboxEmpty>
</template>

<script setup lang="ts">
import { ComboboxEmpty } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

injectReactiveOrFail<ComboboxExpose>('combobox', '<HeadlessComboboxEmpty> must be a child of a <HeadlessCombobox>');
</script>
