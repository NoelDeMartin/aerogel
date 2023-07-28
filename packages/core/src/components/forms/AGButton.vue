<template>
    <AGHeadlessButton
        class="px-2.5 py-1.5 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        :class="{
            'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600': !secondary,
            'bg-gray-600 hover:bg-gray-500 focus-visible:outline-gray-600': secondary,
        }"
    >
        <slot />
    </AGHeadlessButton>
</template>

<script setup lang="ts">
import { booleanProp } from '@/utils';

import AGHeadlessButton from '../headless/forms/AGHeadlessButton.vue';

defineProps({
    secondary: booleanProp(),
});
</script>
