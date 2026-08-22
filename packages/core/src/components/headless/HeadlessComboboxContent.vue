<template>
    <ComboboxPortal v-if="portal">
        <ComboboxContent
            :position="position"
            :class="renderedClasses"
            :align="align ?? combobox.align"
            :side="side ?? combobox.side"
            :side-offset="sideOffset"
        >
            <div v-bind="$attrs" :class="rootClass">
                <ComboboxViewport :class="innerClass">
                    <slot />
                </ComboboxViewport>
            </div>
        </ComboboxContent>
    </ComboboxPortal>
    <ComboboxContent
        v-else
        :position="position"
        :class="renderedClasses"
        :align="align ?? combobox.align"
        :side="side ?? combobox.side"
        :side-offset="sideOffset"
    >
        <div v-bind="$attrs" :class="rootClass">
            <ComboboxViewport :class="innerClass">
                <slot />
            </ComboboxViewport>
        </div>
    </ComboboxContent>
</template>

<script setup lang="ts">
import { ComboboxContent, ComboboxPortal, ComboboxViewport } from 'reka-ui';
import { computed } from 'vue';
import type { ComboboxContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { classes } from '@aerogel/core/utils/classes';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

defineOptions({ inheritAttrs: false });

const {
    position: positionProp,
    portal = true,
    sideOffset = 4,
    class: rootClass,
} = defineProps<{
    portal?: boolean;
    class?: HTMLAttributes['class'];
    innerClass?: HTMLAttributes['class'];
    align?: ComboboxContentProps['align'];
    side?: ComboboxContentProps['side'];
    sideOffset?: number;
    position?: ComboboxContentProps['position'];
}>();

const combobox = injectReactiveOrFail<ComboboxExpose>(
    'combobox',
    '<HeadlessComboboxContent> must be a child of a <HeadlessCombobox>',
);

const position = computed(() => positionProp ?? (portal ? 'popper' : 'inline'));

const renderedClasses = computed(() =>
    classes(
        position.value === 'popper'
            ? 'min-w-(--reka-combobox-trigger-width) max-h-(--reka-combobox-content-available-height)'
            : '',
    ));
</script>
