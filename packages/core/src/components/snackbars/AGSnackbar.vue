<template>
    <AGHeadlessSnackbar class="flex flex-row items-center justify-center gap-3 p-4" :class="styleClasses">
        <AGMarkdown :text="message" inline />
        <AGButton
            v-for="(action, i) of actions"
            :key="i"
            :color="color"
            @click="activate(action)"
        >
            {{ action.text }}
        </AGButton>
    </AGHeadlessSnackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import UI from '@/ui/UI';
import { Colors } from '@/components/constants';
import { useSnackbarProps } from '@/components/headless';
import type { SnackbarAction } from '@/components/headless';

import AGButton from '../forms/AGButton.vue';
import AGHeadlessSnackbar from '../headless/snackbars/AGHeadlessSnackbar.vue';
import AGMarkdown from '../lib/AGMarkdown.vue';

const props = defineProps(useSnackbarProps());
const styleClasses = computed(() => {
    switch (props.color) {
        case Colors.Danger:
            return 'bg-red-200 text-red-900';
        default:
        case Colors.Secondary:
            return 'bg-gray-900 text-white';
    }
});

function activate(action: SnackbarAction): void {
    action.handler?.();
    action.dismiss && UI.hideSnackbar(props.id);
}
</script>
