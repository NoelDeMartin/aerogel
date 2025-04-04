<template>
    <Modal v-slot="{ close }" persistent class="flex flex-col items-center gap-4">
        <i-mdi-check-circle class="size-16 text-indigo-600" />
        <AGMarkdown lang-key="components.modals_customContent" class="text-center" />
        <Button @click="close()">
            {{ $t('components.modals_customClose') }}
        </Button>
    </Modal>
</template>
