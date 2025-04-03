<template>
    <BaseModal>
        <AGHeadlessModalTitle class="isolate z-10 text-base leading-6 font-semibold text-gray-900">
            <AGMarkdown lang-key="components.modals_nestedTitle" :lang-params="{ count }" inline />
        </AGHeadlessModalTitle>
        <div class="mt-3 flex flex-col items-center">
            <div class="flex flex-wrap">
                <i-twemoji-turtle
                    v-for="i in count"
                    :key="i"
                    class="-mt-6 mb-4 size-20"
                    :aria-label="$t('components.modals_nestedTurtle')"
                    :title="$t('components.modals_nestedTurtle')"
                />
            </div>
            <AGMarkdown lang-key="components.modals_nestedMessage" class="mb-4" />
            <BaseButton @click="$events.emit('all-the-way-down', count + 1)">
                {{ $t('components.modals_nestedButton') }}
            </BaseButton>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { numberProp } from '@aerogel/core';

defineProps({ count: numberProp(1) });
</script>
