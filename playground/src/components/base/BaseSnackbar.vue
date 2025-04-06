<template>
    <AGHeadlessSnackbar class="overflow-hidden rounded-lg shadow-lg ring-1" :class="colorClasses">
        <div class="flex items-center gap-3 p-4">
            <Markdown :text="message" inline />

            <Button
                v-for="(action, i) of actions"
                :key="i"
                :variant="color"
                @click="activate(action)"
            >
                {{ action.text }}
            </Button>
        </div>
    </AGHeadlessSnackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Colors, useSnackbar, useSnackbarProps } from '@aerogel/core';

const props = defineProps(useSnackbarProps());
const { activate } = useSnackbar(props);
const colorClasses = computed(() => {
    switch (props.color) {
        case Colors.Danger:
            return 'bg-red-200 ring-red-500/5 text-red-900';
        default:
        case Colors.Secondary:
            return 'bg-white ring-black/5';
    }
});
</script>
