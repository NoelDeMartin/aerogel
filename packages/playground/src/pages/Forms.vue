<template>
    <PageTitle source="src/pages/Forms.vue">
        {{ $t('forms.title') }}
    </PageTitle>
    <AGForm :form="form" class="flex flex-col items-center" @submit="submit()">
        <CoreInput
            v-initial-focus
            name="name"
            :aria-label="$t('forms.name_label')"
            :placeholder="$t('forms.name_placeholder')"
        />
        <CoreButton submit class="mt-2 flex-shrink-0">
            {{ $t('forms.submit') }}
        </CoreButton>
    </AGForm>
</template>

<script setup lang="ts">
import { UI, requiredStringInput, translate, useForm } from '@aerogel/core';
import { stringToSlug } from '@noeldemartin/utils';

const form = useForm({
    name: requiredStringInput(),
});

function submit() {
    if (!form.name) {
        return;
    }

    if (stringToSlug(form.name) === 'heisenberg') {
        UI.alert('You\'re Goddamn Right!');

        return;
    }

    UI.alert(translate('forms.greeting', { name: form.name }));
}
</script>
