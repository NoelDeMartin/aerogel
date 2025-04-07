<template>
    <Modal>
        <HeadlessModalTitle class="isolate z-10 text-base leading-6 font-semibold text-gray-900">
            <Markdown lang-key="components.modals_nestedTitle" :lang-params="{ count }" inline />
        </HeadlessModalTitle>
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
            <Markdown lang-key="components.modals_nestedMessage" class="mb-4" />
            <Button @click="$events.emit('all-the-way-down', count + 1)">
                {{ $t('components.modals_nestedButton') }}
            </Button>
        </div>
    </Modal>
</template>

<script setup lang="ts">
const { count = 1 } = defineProps<{ count: number }>();
</script>
