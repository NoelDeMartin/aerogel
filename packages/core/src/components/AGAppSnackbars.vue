<template>
    <div aria-live="assertive" class="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:p-6">
        <div class="flex w-full flex-col items-end space-y-4">
            <component
                :is="snackbar.component"
                v-for="snackbar of $ui.snackbars"
                :id="snackbar.id"
                :key="snackbar.id"
                v-bind="snackbar.properties"
            />
        </div>
    </div>
</template>
