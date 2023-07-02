<template>
    <AGHeadlessModal v-slot="{ close }" class="relative z-50">
        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 text-center">
                <AGHeadlessModalPanel
                    class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all"
                >
                    <div class="absolute right-0 top-0 pr-3 pt-3">
                        <button
                            type="button"
                            class="h-8 w-8 rounded-full bg-white text-2xl text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            @click="close()"
                        >
                            <span class="sr-only">
                                {{ $t('ui.close') }}
                            </span>
                            &times;
                        </button>
                    </div>
                    <AGHeadlessModalTitle v-if="renderedTitle" class="text-base font-semibold leading-6 text-gray-900">
                        {{ renderedTitle }}
                    </AGHeadlessModalTitle>
                    <div class="mt-3">
                        <slot :close="close" />
                    </div>
                </AGHeadlessModalPanel>
            </div>
        </div>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { stringProp, translate } from '@aerogel/core';

const props = defineProps({
    title: stringProp(),
    titleLangKey: stringProp(),
});

const renderedTitle = computed(() => {
    if (props.titleLangKey) {
        return translate(props.titleLangKey);
    }

    if (props.title) {
        return props.title;
    }

    return false;
});
</script>
