<template>
    <AGHeadlessSnackbar class="overflow-hidden rounded-lg shadow-lg ring-1 ring-opacity-5" :class="colorClasses">
        <div class="flex items-center gap-3 p-4">
            <AGMarkdown :text="message" inline />

            <BaseButton
                v-for="(action, i) of actions"
                :key="i"
                :color="color"
                @click="activate(action)"
            >
                {{ action.text }}
            </BaseButton>
        </div>
    </AGHeadlessSnackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Colors, UI, useSnackbarProps } from '@aerogel/core';
import type { SnackbarAction } from '@aerogel/core';

const props = defineProps(useSnackbarProps());
const colorClasses = computed(() => {
    switch (props.color) {
        case Colors.Danger:
            return 'bg-red-200 ring-red-500 text-red-900';
        default:
        case Colors.Secondary:
            return 'bg-white ring-black';
    }
});

function activate(action: SnackbarAction): void {
    action.handler?.();
    action.dismiss && UI.hideSnackbar(props.id);
}
</script>
