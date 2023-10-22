<template>
    <BaseModal>
        <BaseButton @click="$ui.alert($t('components.modals_nestedAlert'))">
            {{ $t('components.modals_nestedButton') }}
        </BaseButton>
    </BaseModal>
</template>
