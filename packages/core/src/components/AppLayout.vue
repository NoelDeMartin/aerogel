<template>
    <div class="flex min-h-full flex-col text-base leading-tight font-normal text-gray-900 antialiased">
        <slot v-if="$errors.hasStartupErrors" name="startup-crash">
            <component :is="$ui.requireComponent('startup-crash')" />
        </slot>
        <slot v-else />

        <AppOverlays />
    </div>
</template>

<script setup lang="ts">
import AppOverlays from './AppOverlays.vue';
</script>
