<template>
    <ListboxButton ref="$root">
        <slot />
    </ListboxButton>
</template>

<script setup lang="ts">
import { ListboxButton } from '@headlessui/vue';
import { watchEffect } from 'vue';

import { elementRef } from '@/components/utils';
import { injectReactiveOrFail } from '@/utils/vue';
import type { __ISelect } from '@/components/contracts/Select';

const $root = elementRef();
const input = injectReactiveOrFail<__ISelect>('select', '<SelectTrigger> must be a child of a <Select>');

watchEffect(() => input.__setButtonElement($root.value));
</script>
