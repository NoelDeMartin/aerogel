<template>
    <slot :id="`${input.id}-description`">
        <AGMarkdown
            v-if="show"
            v-bind="$attrs"
            :id="`${input.id}-description`"
            :text="text"
        />
    </slot>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { injectReactiveOrFail } from '@/utils/vue';

import AGMarkdown from '../../lib/AGMarkdown.vue';
import type { IAGHeadlessInput } from './AGHeadlessInput';

defineOptions({ inheritAttrs: false });

const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputDescription> must be a child of a <AGHeadlessInput>',
);
const text = computed(() => (typeof input.description === 'string' ? input.description : ''));
const show = computed(() => !!input.description);
</script>
