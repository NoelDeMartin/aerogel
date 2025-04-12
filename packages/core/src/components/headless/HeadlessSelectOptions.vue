<template>
    <SelectPortal>
        <SelectContent
            position="popper"
            :class="renderedClasses"
            :align="select.align"
            :side="select.side"
            :side-offset="4"
        >
            <SelectViewport :class="innerClass">
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
import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { classes } from '@aerogel/core/utils/classes';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import HeadlessSelectOption from './HeadlessSelectOption.vue';

const { class: rootClass } = defineProps<{ class?: HTMLAttributes['class']; innerClass?: HTMLAttributes['class'] }>();

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectOptions> must be a child of a <HeadlessSelect>',
);
const renderedClasses = computed(() =>
    classes('min-w-(--reka-select-trigger-width) max-h-(--reka-select-content-available-height)', rootClass));
</script>
