<template>
    <PageTitle source="src/pages/offline/Offline.vue">
        {{ $t('offline.title') }}
    </PageTitle>

    <CloudStatus />

    <!-- TODO this should work even without remote, and migrate on log in -->
    <OfflineTasks v-if="$offlineTasks.hasRemote" />
</template>
