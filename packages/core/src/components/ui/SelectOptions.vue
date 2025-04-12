<template>
    <HeadlessSelectOptions :class="renderedClasses">
        <slot v-if="select?.options?.length">
            <SelectOption v-for="option of select?.options ?? []" :key="option.key" :value="option.value">
                {{ option.label }}
            </SelectOption>
        </slot>
        <slot v-else name="empty">
            <SelectOption disabled :value="null">
                {{ $td('ui.selectEmpty', 'No options available') }}
            </SelectOption>
        </slot>
    </HeadlessSelectOptions>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';

import HeadlessSelectOptions from '@aerogel/core/components/headless/HeadlessSelectOptions.vue';
import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import SelectOption from './SelectOption.vue';

const { class: rootClasses } = defineProps<{ class?: HTMLAttributes['class'] }>();

const select = injectReactiveOrFail<SelectExpose>('select', '<SelectOptions> must be a child of a <Select>');
const renderedClasses = computed(() =>
    classes(
        'z-50 overflow-auto rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden',
        select.optionsClass,
        rootClasses,
    ));
</script>
