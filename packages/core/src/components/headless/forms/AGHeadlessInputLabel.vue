<template>
    <label v-if="input.label" :for="input.id">
        <slot>
            {{ input.label }}
        </slot>
    </label>
</template>

<script setup lang="ts">
import { injectReactiveOrFail } from '@/utils/vue';

import type { IAGHeadlessInput } from './AGHeadlessInput';

const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputLabel> must be a child of a <AGHeadlessInput>',
);
</script>
