<template>
    <slot :id="`${formControl.id}-description`">
        <Markdown
            v-if="show"
            v-bind="$attrs"
            :id="`${formControl.id}-description`"
            :text
        />
    </slot>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { FormControlExpose } from '@aerogel/core/components/contracts/FormControl';

defineOptions({ inheritAttrs: false });

const formControl = injectReactiveOrFail<FormControlExpose>(
    'form-control',
    '<HeadlessFormControlDescription> must be a child of a <HeadlessFormControl>',
);
const text = computed(() => (typeof formControl.description === 'string' ? formControl.description : ''));
const show = computed(() => !!formControl.description);
</script>
