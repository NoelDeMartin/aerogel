<template>
    <SelectTrigger>
        <SelectValue>
            <slot>
                <span :class="textClass">{{ select?.buttonText }}</span>
            </slot>
            <slot name="icon" />
        </SelectValue>
    </SelectTrigger>
</template>

<script setup lang="ts">
import { SelectTrigger, SelectValue } from 'reka-ui';

import { injectReactiveOrFail, stringProp } from '@aerogel/core/utils/vue';

import type { IAGHeadlessSelect } from './AGHeadlessSelect';

defineProps({ textClass: stringProp() });

const select = injectReactiveOrFail<IAGHeadlessSelect>(
    'select',
    '<AGHeadlessSelectTrigger> must be a child of a <AGHeadlessSelect>',
);
</script>
