<template>
    <ToastProvider>
        <component
            :is="toast.component"
            v-for="toast of $ui.toasts"
            :id="toast.id"
            :key="toast.id"
            v-bind="toast.properties"
        />
        <ToastViewport class="fixed right-0 bottom-0 z-50 flex flex-col items-end space-y-4 px-4 py-6 sm:p-6" />
    </ToastProvider>
</template>

<script setup lang="ts">
import { ToastProvider, ToastViewport } from 'reka-ui';
</script>
