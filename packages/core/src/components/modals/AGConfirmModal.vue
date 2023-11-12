<template>
    <AGModal v-slot="{ close }: IAGModalSlotProps" :cancellable="false">
        <AGMarkdown v-if="title" :text="title" as="h1" />
        <AGMarkdown :text="message" />

        <div class="mt-2 flex flex-row-reverse gap-2">
            <AGButton @click="close(true)">
                {{ $td('ui.ok', 'OK') }}
            </AGButton>
            <AGButton color="secondary" @click="close()">
                {{ $td('ui.cancel', 'Cancel') }}
            </AGButton>
        </div>
    </AGModal>
</template>

<script setup lang="ts">
import { requiredStringProp, stringProp } from '@/utils/vue';

import AGModal from './AGModal.vue';
import type { IAGModalSlotProps } from './AGModal';

import AGButton from '../forms/AGButton.vue';
import AGMarkdown from '../basic/AGMarkdown.vue';

defineProps({
    title: stringProp(),
    message: requiredStringProp(),
});
</script>
