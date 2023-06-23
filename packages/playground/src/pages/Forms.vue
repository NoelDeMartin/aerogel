<template>
    <PageTitle source="src/pages/Forms.vue">
        {{ $t('forms.title') }}
    </PageTitle>
    <AGForm :form="form" @submit="submit()">
        <div class="flex flex-row">
            <AGInput
                v-initial-focus
                name="name"
                :aria-label="$t('forms.name_label')"
                :placeholder="$t('forms.name_placeholder')"
            />
            <AGButton submit class="ml-2 flex-shrink-0">
                {{ $t('forms.submit') }}
            </AGButton>
        </div>
    </AGForm>
</template>

<script setup lang="ts">
import { FormFieldTypes, UI, lang, useForm } from '@aerogel/core';
import { stringToSlug } from '@noeldemartin/utils';

const form = useForm({
    name: { type: FormFieldTypes.String },
});

function submit() {
    if (!form.name) {
        return;
    }

    if (stringToSlug(form.name) === 'heisenberg') {
        UI.alert('You\'re Goddamn Right!');

        return;
    }

    UI.alert(lang('forms.greeting', { name: form.name }));
}
</script>
