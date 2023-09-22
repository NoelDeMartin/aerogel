<template>
    <AGForm :form="form" @submit="$solid.login(form.url)">
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

        <div v-if="$solid.previousSession?.error">
            <AGMarkdown :text="$t('solid.loginError')" />
        </div>

        <div v-else-if="$solid.previousSession" class="mt-4 rounded-md border p-4">
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
</template>

<script setup lang="ts">
import { requiredStringInput, useForm } from '@aerogel/core';

const form = useForm({
    url: requiredStringInput(),
});
</script>
