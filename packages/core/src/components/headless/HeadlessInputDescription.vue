<template>
    <slot :id="`${input.id}-description`">
        <Markdown
            v-if="show"
            v-bind="$attrs"
            :id="`${input.id}-description`"
            :text
        />
    </slot>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { InputExpose } from '@aerogel/core/components/contracts/Input';

defineOptions({ inheritAttrs: false });

const input = injectReactiveOrFail<InputExpose>(
    'input',
    '<HeadlessInputDescription> must be a child of a <HeadlessInput>',
);
const text = computed(() => (typeof input.description === 'string' ? input.description : ''));
const show = computed(() => !!input.description);
</script>
