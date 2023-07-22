<template>
    <PageTitle source="src/pages/modals/Modals.vue">
        {{ $t('modals.title') }}
    </PageTitle>
    <div class="flex flex-row justify-center gap-3">
        <AppButton @click="$ui.openModal(HelloDefaultModal)">
            {{ $t('modals.showDefault') }}
        </AppButton>
        <AppButton @click="$ui.openModal(HelloCustomModal)">
            {{ $t('modals.showCustom') }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
import HelloCustomModal from './components/HelloCustomModal.vue';
import HelloDefaultModal from './components/HelloDefaultModal.vue';
</script>
