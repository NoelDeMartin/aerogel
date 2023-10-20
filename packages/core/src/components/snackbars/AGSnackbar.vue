<template>
    <AGHeadlessSnackbar class="flex flex-row items-center justify-center gap-3 bg-gray-900 p-4 text-white">
        <AGMarkdown :text="message" raw />
        <AGButton
            v-for="(action, i) of actions"
            :key="i"
            secondary
            @click="activate(action)"
        >
            {{ action.text }}
        </AGButton>
    </AGHeadlessSnackbar>
</template>

<script setup lang="ts">
import UI from '@/ui/UI';
import { useSnackbarProps } from '@/components/headless';
import type { AGSnackbarAction } from '@/components/headless';

import AGButton from '../forms/AGButton.vue';
import AGHeadlessSnackbar from '../headless/snackbars/AGHeadlessSnackbar.vue';
import AGMarkdown from '../basic/AGMarkdown.vue';

const props = defineProps(useSnackbarProps());

function activate(action: AGSnackbarAction): void {
    action.handler?.();
    action.dismiss && UI.hideSnackbar(props.id);
}
</script>
