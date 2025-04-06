<template>
    <AGHeadlessSnackbar class="flex flex-row items-center justify-center gap-3 p-4" :class="styleClasses">
        <Markdown :text="message" inline />
        <Button
            v-for="(action, i) of actions"
            :key="i"
            :variant="colorVariant"
            @click="activate(action)"
        >
            {{ action.text }}
        </Button>
    </AGHeadlessSnackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { Colors } from '@aerogel/core/components/constants';
import { useSnackbar, useSnackbarProps } from '@aerogel/core/components/headless/snackbars';
import type { ButtonVariant } from '@aerogel/core/components/contracts/Button';

import Button from '../ui/Button.vue';
import AGHeadlessSnackbar from '../headless/snackbars/AGHeadlessSnackbar.vue';
import Markdown from '../ui/Markdown.vue';

const props = defineProps(useSnackbarProps());
const { activate } = useSnackbar(props);
const styleClasses = computed(() => {
    switch (props.color) {
        case Colors.Danger:
            return 'bg-red-200 text-red-900';
        default:
        case Colors.Secondary:
            return 'bg-gray-900 text-white';
    }
});
const colorVariant = computed(() => props.color as ButtonVariant);
</script>
