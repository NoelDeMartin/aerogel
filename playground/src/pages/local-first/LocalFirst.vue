<template>
    <PageTitle source="src/pages/local-first/LocalFirst.vue">
        {{ $t('localFirst.title') }}

        <template #end>
            <Account />
        </template>
    </PageTitle>

    <LocalTasks />
</template>
