<template>
    <BaseModal v-slot="{ close }" :cancellable="false">
        <div class="flex flex-col items-center gap-4">
            <i-mdi-check-circle class="size-16 text-indigo-600" />
            <AGMarkdown lang-key="components.modals_customContent" class="text-center" />
            <Button @click="close()">
                {{ $t('components.modals_customClose') }}
            </Button>
        </div>
    </BaseModal>
</template>
