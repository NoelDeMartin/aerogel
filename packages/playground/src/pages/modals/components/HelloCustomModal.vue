<template>
    <AppModal v-slot="{ close }" title-lang-key="modals.customModal.title" :cancellable="false">
        <AGMarkdown lang-key="modals.customModal.content" />
        <div class="mt-3 flex justify-end">
            <button
                v-initial-focus
                class="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                type="button"
                @click="close()"
            >
                {{ $t('modals.customModal.button') }}
            </button>
        </div>
    </AppModal>
</template>
