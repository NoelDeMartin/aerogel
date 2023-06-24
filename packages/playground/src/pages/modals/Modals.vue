<template>
    <PageTitle source="src/pages/modals/Modals.vue">
        {{ $t('modals.title') }}
    </PageTitle>
    <div class="flex flex-row justify-center gap-3">
        <button
            class="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            type="button"
            @click="$ui.openModal(HelloDefaultModal)"
        >
            {{ $t('modals.showDefault') }}
        </button>
        <button
            class="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            type="button"
            @click="$ui.openModal(HelloCustomModal)"
        >
            {{ $t('modals.showCustom') }}
        </button>
    </div>
</template>

<script setup lang="ts">
import HelloCustomModal from './components/HelloCustomModal.vue';
import HelloDefaultModal from './components/HelloDefaultModal.vue';
</script>
