<template>
    <BaseModal>
        <BaseButton @click="$ui.alert($t('modals.nestedAlert'))">
            {{ $t('modals.nestedButton') }}
        </BaseButton>
    </BaseModal>
</template>
