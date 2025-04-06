<template>
    <PageTitle source="src/pages/Forms.vue">
        {{ $t('forms.title') }}
    </PageTitle>
    <Form :form="form" class="flex grow flex-col items-center" @submit="submit()">
        <div class="mt-8 flex flex-col items-center rounded-lg bg-gray-100 p-8 pb-4 shadow-2xs">
            <div class="flex">
                <Input
                    autofocus
                    name="name"
                    class="h-full"
                    input-class="h-full"
                    wrapper-class="h-full"
                    :aria-label="$t('forms.name_label')"
                    :placeholder="$t('forms.name_placeholder')"
                />
                <Button submit class="ml-2 shrink-0">
                    {{ $t('forms.submit') }}
                </Button>
            </div>

            <Checkbox name="accept" class="mt-4">
                {{ $t('forms.conditions') }}
            </Checkbox>
        </div>
    </Form>
</template>

<script setup lang="ts">
import { UI, requiredBooleanInput, requiredStringInput, translate, useForm } from '@aerogel/core';
import { stringToSlug } from '@noeldemartin/utils';

const form = useForm({
    name: requiredStringInput(),
    accept: requiredBooleanInput(true),
});

function submit() {
    if (stringToSlug(form.name) === 'heisenberg') {
        UI.alert('You\'re Goddamn Right!');

        return;
    }

    UI.alert(translate('forms.greeting', { name: form.name }));

    form.reset();
}
</script>
