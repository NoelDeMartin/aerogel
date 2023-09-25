<template>
    <PageTitle source="src/pages/modals/Modals.vue">
        {{ $t('modals.title') }}
    </PageTitle>
    <div class="flex flex-row justify-center gap-3">
        <BaseButton @click="$ui.alert($t('modals.alertTitle'), $t('modals.alertMessage'))">
            {{ $t('modals.alert') }}
        </BaseButton>
        <BaseButton @click="showConfirmModal()">
            {{ $t('modals.confirm') }}
        </BaseButton>
        <BaseButton @click="$ui.loading(after({ seconds: 3 }))">
            {{ $t('modals.loading') }}
        </BaseButton>
        <BaseButton @click="$ui.openModal(NestedModal)">
            {{ $t('modals.nested') }}
        </BaseButton>
        <BaseButton @click="$ui.openModal(CustomModal)">
            {{ $t('modals.custom') }}
        </BaseButton>
    </div>
</template>

<script setup lang="ts">
import { after } from '@noeldemartin/utils';
import { UI, translate } from '@aerogel/core';

import CustomModal from './components/CustomModal.vue';
import NestedModal from './components/NestedModal.vue';

async function showConfirmModal() {
    const confirmed = await UI.confirm(translate('modals.confirmMessage'));

    UI.alert(confirmed ? translate('modals.confirmConfirmed') : translate('modals.confirmCancelled'));
}
</script>
