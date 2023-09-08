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
            </BaseButton>
        </div>
    </AGForm>

    <AGMarkdown
        v-else
        :text="
            $t('solid.welcome', {
                name: $solid.user?.name ?? $solid.user?.webId,
                url: $solid.user?.webId,
            })
        "
    />
</template>

<script setup lang="ts">
import { requiredStringInput, useForm } from '@aerogel/core';

const form = useForm({
    url: requiredStringInput(),
});
</script>
