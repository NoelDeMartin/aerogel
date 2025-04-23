<template>
    <Modal
        v-slot="{ close }"
        :title="$t('components.modals_customTitle')"
        :description="$t('components.modals_customDescription')"
        persistent
        class="flex flex-col items-center gap-4"
    >
        <i-twemoji-squinting-face-with-tongue class="size-30" />
        <Button @click="close()">
            {{ $t('components.modals_customClose') }}
        </Button>
    </Modal>
</template>
