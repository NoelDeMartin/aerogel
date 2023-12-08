<template>
    <AGHeadlessSnackbar :class="colorClasses">
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
import { Colors, useSnackbar, useSnackbarProps } from '@aerogel/core';

const props = defineProps(useSnackbarProps());
const { activate } = useSnackbar(props);

const colorClasses = computed(() => {
    switch (props.color) {
        case Colors.Danger:
            // Add your custom color classes here.
            return '';
        case Colors.Secondary:
        default:
            // Add your custom color classes here.
            return '';
    }
});
</script>
