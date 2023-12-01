<template>
    <div class="flex min-h-full flex-col text-base font-normal leading-tight text-gray-900 antialiased">
        <slot v-if="$errors.hasStartupErrors" name="startup-crash">
            <AGStartupCrash />
        </slot>
        <slot v-else />

        <AGAppOverlays />
    </div>
</template>

<script setup lang="ts">
import AGAppOverlays from './AGAppOverlays.vue';
import AGStartupCrash from './lib/AGStartupCrash.vue';
</script>
