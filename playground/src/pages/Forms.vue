<template>
    <PageTitle source="src/pages/Forms.vue">
        {{ $t('forms.title') }}
    </PageTitle>
    <Form :form class="flex grow flex-col items-center" @submit="submit()">
        <div class="mt-8 flex w-full max-w-sm flex-col gap-3 rounded-lg bg-gray-100 p-8 shadow-2xs">
            <Input
                autofocus
                name="name"
                :label="$t('forms.name_label')"
                :placeholder="$t('forms.name_placeholder')"
            />

            <Combobox
                name="roles"
                :label="$t('forms.roles_label')"
                :placeholder="$t('forms.roles_placeholder')"
                :options="ROLES"
                :render-option="renderRole"
            />

            <Checkbox name="accept">
                {{ $t('forms.conditions') }}
            </Checkbox>

            <Button submit>
                {{ $t('forms.submit') }}
            </Button>
        </div>
    </Form>
</template>

<script setup lang="ts">
import { UI, translate, translateWithDefault, useForm } from '@aerogel/core';
import { stringToSlug } from '@noeldemartin/utils';
import { z } from 'zod';

const ROLES = ['cook', 'chemistry_teacher', 'kingpin', 'father', 'meth_manufacturer', 'pizza_thrower'] as const;
type Role = (typeof ROLES)[number];

const form = useForm({
    name: z.string(),
    roles: z.array(z.enum(ROLES, { message: 'invalid_role' })).min(1, 'required').max(3, 'too_many_roles').default([]),
    accept: z.literal(true),
});

function renderRole(role: Role): string {
    return translateWithDefault(`forms.roles.${role}`, role);
}

function submit() {
    if (stringToSlug(form.name) === 'heisenberg') {
        UI.alert('You\'re Goddamn Right!');

        return;
    }

    UI.alert(
        translate('forms.greeting', {
            name: form.name,
            roles: form.roles.map(renderRole).join(', '),
        }),
    );

    form.reset();
}
</script>
