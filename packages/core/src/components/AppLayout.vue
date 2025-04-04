<template>
    <div class="flex min-h-full flex-col text-base leading-tight font-normal text-gray-900 antialiased">
        <slot v-if="$errors.hasStartupErrors" name="startup-crash">
            <component :is="$ui.requireComponent(UIComponents.StartupCrash)" />
        </slot>
        <slot v-else />

        <AppOverlays />
    </div>
</template>

<script setup lang="ts">
import { UIComponents } from '@aerogel/core/ui/UI';

import AppOverlays from './AppOverlays.vue';
</script>
