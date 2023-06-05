<template>
    <SectionTitle>{{ $t('modals.title') }}</SectionTitle>
    <div class="flex flex-row gap-3">
        <button
            class="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            type="button"
            @click="showDefaultModal()"
        >
            {{ $t('modals.showDefault') }}
        </button>
        <button
            class="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            type="button"
            @click="showCustomModal()"
        >
            {{ $t('modals.showCustom') }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { UI } from '@aerogel/core';

import HelloCustomModal from './components/HelloCustomModal.vue';
import HelloDefaultModal from './components/HelloDefaultModal.vue';

async function showDefaultModal() {
    await UI.openModal(HelloDefaultModal);
}

async function showCustomModal() {
    await UI.openModal(HelloCustomModal);
}
</script>
