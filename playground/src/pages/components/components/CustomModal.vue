<template>
    <BaseModal v-slot="{ close }" :cancellable="false">
        <div class="flex flex-col items-center gap-4">
            <i-mdi-check-circle class="h-16 w-16 text-indigo-600" />
            <AGMarkdown lang-key="components.modals_customContent" class="text-center" />
            <BaseButton @click="close()">
                {{ $t('components.modals_customClose') }}
            </BaseButton>
        </div>
    </BaseModal>
</template>
