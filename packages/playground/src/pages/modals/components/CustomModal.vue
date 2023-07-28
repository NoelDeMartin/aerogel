<template>
    <BaseModal v-slot="{ close }" :cancellable="false">
        <div class="flex flex-col items-center gap-4">
            <i-mdi-check-circle class="h-16 w-16 text-indigo-600" aria-hidden="true" />
            <AGMarkdown lang-key="modals.customContent" />
            <BaseButton @click="close()">
                {{ $t('modals.customClose') }}
            </BaseButton>
        </div>
    </BaseModal>
</template>
