<template>
    <SelectPortal>
        <SelectContent :class="class">
            <SelectViewport>
                <slot />
            </SelectViewport>
        </SelectContent>
    </SelectPortal>
</template>

<script setup lang="ts">
import { SelectContent, SelectPortal, SelectViewport } from 'reka-ui';

import { stringProp } from '@aerogel/core/utils/vue';

defineProps({ class: stringProp('') });
</script>
