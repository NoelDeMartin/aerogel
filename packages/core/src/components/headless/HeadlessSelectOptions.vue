<template>
    <SelectPortal>
        <SelectContent
            position="popper"
            :class="$props.class"
            :align="select.align"
            :side="select.side"
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
import type { HTMLAttributes } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import HeadlessSelectOption from './HeadlessSelectOption.vue';

defineProps<{ class?: HTMLAttributes['class']; innerClass?: HTMLAttributes['class'] }>();

const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectOptions> must be a child of a <HeadlessSelect>',
);
</script>
