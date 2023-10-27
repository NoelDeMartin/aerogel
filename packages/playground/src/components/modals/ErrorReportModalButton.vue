<template>
    <BaseButton color="clear" class="group whitespace-nowrap">
        <component :is="iconComponent" class="h-4 w-4" />
        <span
            v-measure="() => (measured = true)"
            :class="{
                absolute: !measured,
                'w-0 overflow-hidden transition-[width] group-hover:w-[--width] group-focus:w-[--width]': measured,
            }"
        >
            {{ description }}
        </span>
    </BaseButton>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { requiredObjectProp, requiredStringProp } from '@aerogel/core';
import type { Component } from 'vue';

defineProps({
    iconComponent: requiredObjectProp<Component>(),
    description: requiredStringProp(),
});

const measured = ref(false);
</script>
