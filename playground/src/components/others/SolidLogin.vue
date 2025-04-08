<template>
    <Form :form @submit="$solid.login(form.url)">
        <div class="flex gap-2">
            <Input
                autofocus
                name="url"
                :aria-label="$t('solid.url')"
                :placeholder="$t('solid.url_placeholder')"
            />
            <Button submit>
                {{ $t('solid.login') }}
                <i-mdi-login class="size-4" />
            </Button>
        </div>

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
    </Form>
</template>

<script setup lang="ts">
import { requiredStringInput, useForm } from '@aerogel/core';

const form = useForm({
    url: requiredStringInput(),
});
</script>
