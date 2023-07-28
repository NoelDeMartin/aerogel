<template>
    <BaseModal v-slot="{ close }" :title="title" :cancellable="false">
        <AGMarkdown :text="message" />

        <div class="mt-4 flex flex-row-reverse gap-2">
            <BaseButton @click="close(true)">
                {{ $t('ui.ok') }}
            </BaseButton>
            <BaseButton color="clear" @click="close(false)">
                {{ $t('ui.cancel') }}
            </BaseButton>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { requiredStringProp, stringProp } from '@aerogel/core';

defineProps({
    title: stringProp(),
    message: requiredStringProp(),
});
</script>
