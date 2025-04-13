<template>
    <PageTitle source="src/pages/solid/Solid.vue">
        {{ $t('solid.title') }}
    </PageTitle>

    <template v-if="!$solid.isLoggedIn()">
        <SolidLogin />

        <div v-if="!$solid.ignorePreviousSessionError && $solid.previousSession?.error">
            <Markdown lang-key="solid.loginError" />
        </div>

        <div v-else-if="$solid.previousSession" class="mt-4 rounded-md border border-gray-200 p-4">
            <Markdown
                :text="
                    $t('solid.previousSession', {
                        name: $solid.previousSession.loginUrl,
                        url: $solid.previousSession.loginUrl,
                    })
                "
                class="max-w-none text-sm"
            />
            <Button small class="mt-2" @click="$solid.reconnect()">
                {{ $t('solid.reconnect') }}
            </Button>
        </div>
    </template>

    <div v-else-if="!$solidTasks.ready">
        {{ $t('ui.loading') }}
    </div>

    <template v-else>
        <SolidStatus />
        <SolidTasks />
    </template>
</template>
