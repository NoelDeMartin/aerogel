<template>
    <PageTitle source="src/pages/Solid.vue">
        {{ $t('solid.title') }}
    </PageTitle>

    <AGForm v-if="!$solid.loggedIn" :form="form" @submit="$solid.login(form.url)">
        <div class="flex gap-2">
            <BaseInput
                v-initial-focus
                name="url"
                :aria-label="$t('solid.url')"
                :placeholder="$t('solid.url_placeholder')"
            />
            <BaseButton submit>
                {{ $t('solid.login') }}
                <i-mdi-login aria-hidden="true" class="h-4 w-4" />
            </BaseButton>
        </div>

        <div v-if="$solid.previousSession" class="mt-4 rounded-md border p-4">
            <AGMarkdown
                :text="
                    $t('solid.previousSession', {
                        name: $solid.previousSession.loginUrl,
                        url: $solid.previousSession.loginUrl,
                    })
                "
                class="max-w-none text-sm"
            />
            <BaseButton small class="mt-2" @click="$solid.reconnect()">
                {{ $t('solid.reconnect') }}
            </BaseButton>
        </div>
    </AGForm>

    <div v-else-if="!$solidTasks.ready">
        {{ $t('ui.loading') }}
    </div>

    <template v-else>
        <div>
            <AGMarkdown
                :text="
                    $t('solid.welcome', {
                        name: $solid.user?.name ?? $solid.user?.webId,
                        url: $solid.user?.webId,
                    })
                "
            />

            <BaseButton
                small
                color="clear"
                class="mt-1"
                @click="$solid.logout()"
            >
                {{ $t('solid.logout') }}
                <i-mdi-logout aria-hidden="true" class="h-4 w-4" />
            </BaseButton>
        </div>

        <SolidTasks />
    </template>
</template>

<script setup lang="ts">
import { requiredStringInput, useForm } from '@aerogel/core';

const form = useForm({
    url: requiredStringInput(),
});
</script>
