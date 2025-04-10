<template>
    <HeadlessSelectOption :class="renderedOuterClasses" :value>
        <div :class="renderedInnerClasses">
            <slot />
        </div>
    </HeadlessSelectOption>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AcceptableValue } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import HeadlessSelectOption from '@aerogel/core/components/headless/HeadlessSelectOption.vue';
import { classes } from '@aerogel/core/utils';

const { class: outerClass, innerClass } = defineProps<{
    value: AcceptableValue;
    class?: HTMLAttributes['class'];
    innerClass?: HTMLAttributes['class'];
}>();
const renderedOuterClasses = computed(() => classes('group p-1 outline-none', outerClass));
const renderedInnerClasses = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'relative flex max-w-[calc(100vw-2rem)] cursor-pointer items-center truncate rounded-md gap-2 px-2 py-1 text-sm select-none *:truncate group-data-[highlighted]:bg-gray-100 group-data-[state=checked]:font-semibold group-data-[state=unchecked]:opacity-50',
        innerClass,
    ));
</script>
