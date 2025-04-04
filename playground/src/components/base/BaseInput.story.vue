<template>
    <Story group="base" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <Form :form="form">
                <BaseInput name="food" :label="label" :placeholder="placeholder" />
            </Form>

            <template #controls>
                <HstText v-model="label" title="Label" />
                <HstText v-model="placeholder" title="Placeholder" />
                <HstCheckbox v-model="hasErrors" title="Errors" />
            </template>
        </Variant>

        <Variant title="Default">
            <BaseInput label="What's the best food?" placeholder="Ramen" />
        </Variant>

        <Variant title="Hover">
            <BaseInput label="What's the best food?" placeholder="Ramen" input-class=":hover" />
        </Variant>

        <Variant title="Focus">
            <BaseInput label="What's the best food?" placeholder="Ramen" input-class=":focus :focus-visible" />
        </Variant>

        <Variant title="Error">
            <Form :form="errorForm">
                <BaseInput
                    name="food"
                    label="What's the best food?"
                    placeholder="Ramen"
                    class=":focus :focus-visible"
                />
            </Form>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { requiredStringInput, useForm } from '@aerogel/core';
import { ref, watchEffect } from 'vue';

const form = useForm({ food: requiredStringInput() });
const errorForm = useForm({ food: requiredStringInput() });
const label = ref('What\'s the best food?');
const placeholder = ref('Ramen');
const hasErrors = ref(false);

errorForm.submit();

watchEffect(() => (hasErrors.value ? form.submit() : form.reset()));
</script>

<style>
.story-baseinput {
    grid-template-columns: repeat(2, 300px) !important;
}

.story-baseinput .variant-playground {
    grid-column: 1 / -1;
}
</style>
