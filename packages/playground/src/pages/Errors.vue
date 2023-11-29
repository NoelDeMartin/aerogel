<template>
    <PageTitle source="src/pages/Errors.vue">
        {{ $t('errors.title') }}
    </PageTitle>
    <div class="flex w-full items-center justify-center gap-3">
        <BaseButton @click="throwError()">
            {{ $t('errors.throw') }}
        </BaseButton>
        <BaseButton
            @click="$errors.report({ name: $t('errors.throwWithoutTraceName'), message: $t('errors.throwMessage') })"
        >
            {{ $t('errors.throwWithoutTrace') }}
        </BaseButton>
        <BaseButton @click="$errors.inspect($errors.logs.map(({ report }) => report))">
            {{ $t('errors.all', { count: $errors.logs.length }) }}
        </BaseButton>
        <BaseButton @click="$app.reload({ startupCrash: true })">
            {{ $t('errors.startupCrash') }}
        </BaseButton>
    </div>
</template>

<script setup lang="ts">
import { translate } from '@aerogel/core';

function throwError(): void {
    throw new Error(translate('errors.throwMessage'));
}
</script>
