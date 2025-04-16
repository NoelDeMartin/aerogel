<template>
    <PageTitle source="src/pages/Errors.vue">
        {{ $t('errors.title') }}

        <template #end>
            <ErrorLogs />
        </template>
    </PageTitle>
    <div class="flex w-full flex-wrap items-center justify-center gap-3">
        <Button @click="throwError()">
            {{ $t('errors.throw') }}
        </Button>
        <Button
            @click="$errors.report({ name: $t('errors.throwWithoutTraceName'), message: $t('errors.throwMessage') })"
        >
            {{ $t('errors.throwWithoutTrace') }}
        </Button>
        <Button @click="$app.reload({ startupCrash: 'true' })">
            {{ $t('errors.startupCrash') }}
        </Button>
    </div>
</template>

<script setup lang="ts">
import { translate } from '@aerogel/core';

function throwError(): void {
    throw new Error(translate('errors.throwMessage'));
}
</script>
