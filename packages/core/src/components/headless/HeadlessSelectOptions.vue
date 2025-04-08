<template>
    <SelectPortal>
        <SelectContent :class="classes">
            <SelectViewport>
                <slot>
                    <HeadlessSelectOption
                        v-for="option in select.options ?? []"
                        :key="option.key"
                        :value="option.value"
                    />
                </slot>
            </SelectViewport>
        </SelectContent>
    </SelectPortal>
</template>

<script setup lang="ts">
import { SelectContent, SelectPortal, SelectViewport } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import HeadlessSelectOption from './HeadlessSelectOption.vue';

const { class: classes } = defineProps<{ class?: string }>();
const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectOptions> must be a child of a <HeadlessSelect>',
);
</script>
