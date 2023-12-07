<template>
    <PageTitle source="src/pages/solid/Solid.vue">
        {{ $t('solid.title') }}
    </PageTitle>

    <SolidLogin v-if="!$solid.isLoggedIn()" />

    <div v-else-if="!$solidTasks.ready">
        {{ $t('ui.loading') }}
    </div>

    <template v-else>
        <SolidStatus />
        <SolidTasks />
    </template>
</template>
