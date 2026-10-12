<template>
    <div class="flex min-h-screen items-center justify-center bg-black/30 p-4">
        <ModalComponent :is="modal" />
    </div>
</template>

<script setup lang="ts">
import { ModalComponent, createModal } from '@aerogel/core';
import { computed } from 'vue';
import type { Component } from 'vue';

const { component, props = {} } = defineProps<{
    component: Component;
    props?: Record<string, unknown>;
}>();

const modal = createModal(
    component,
    Object.fromEntries(Object.keys(props).map((key) => [key, computed(() => props[key])])),
    { metadata: { inline: true } },
);
</script>
