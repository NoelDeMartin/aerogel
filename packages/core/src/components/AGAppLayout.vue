<template>
    <div class="flex min-h-full flex-col text-base font-normal leading-tight text-gray-900 antialiased">
        <slot v-if="$errors.hasStartupErrors" name="startup-crash">
            <component :is="$ui.requireComponent(UIComponents.StartupCrash)" />
        </slot>
        <slot v-else />

        <AGAppOverlays />
    </div>
</template>

<script setup lang="ts">
import { UIComponents } from '@aerogel/core/ui/UI';

import AGAppOverlays from './AGAppOverlays.vue';
</script>
