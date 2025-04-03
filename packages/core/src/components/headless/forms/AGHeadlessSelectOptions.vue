<template>
    <SelectPortal>
        <SelectContent :class="classes">
            <SelectViewport>
                <slot />
            </SelectViewport>
        </SelectContent>
    </SelectPortal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SelectContent, SelectPortal, SelectViewport } from 'reka-ui';

import { stringProp } from '@aerogel/core/utils/vue';

const props = defineProps({ class: stringProp('') });
const classes = computed(() => props.class);
</script>
