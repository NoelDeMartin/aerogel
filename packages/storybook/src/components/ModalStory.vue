<template>
    <ModalComponent :is="modal" />
</template>

<script setup lang="ts">
import { ModalComponent, createModal, provideInlineModals } from '@aerogel/core';
import { computed } from 'vue';
import type { Component } from 'vue';

const { component, props = {} } = defineProps<{
    component: Component;
    props?: Record<string, unknown>;
}>();

const modal = createModal(
    component,
    Object.fromEntries(Object.keys(props).map((key) => [key, computed(() => props[key])])),
);

provideInlineModals();
</script>
