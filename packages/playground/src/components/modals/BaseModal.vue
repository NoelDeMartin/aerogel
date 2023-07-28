<template>
    <AGHeadlessModal v-slot="{ close }" :cancellable="cancellable" class="relative z-50">
        <div class="fixed inset-0 z-10 overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 text-center">
                <AGHeadlessModalPanel
                    class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all"
                >
                    <BaseButton
                        v-if="renderedTitle && cancellable"
                        color="clear"
                        class="absolute right-1 top-3"
                        icon
                        :title="$t('ui.close')"
                        :aria-label="$t('ui.close')"
                        @click="close()"
                    >
                        <i-mdi-close class="h-4 w-4" aria-hidden="true" />
                    </BaseButton>
                    <AGHeadlessModalTitle
                        v-if="renderedTitle"
                        class="mr-12 text-base font-semibold leading-6 text-gray-900"
                    >
                        <AGMarkdown :text="renderedTitle" raw inline />
                    </AGHeadlessModalTitle>
                    <div :class="{ 'mt-3': renderedTitle }">
                        <slot :close="close" />
                    </div>
                </AGHeadlessModalPanel>
            </div>
        </div>
    </AGHeadlessModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { booleanProp, stringProp, translate } from '@aerogel/core';

const props = defineProps({
    title: stringProp(),
    titleLangKey: stringProp(),
    cancellable: booleanProp(true),
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
