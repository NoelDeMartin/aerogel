<template>
    <Story group="base" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <Form :form="form">
                <BaseSelect
                    name="food"
                    :label="label"
                    :no-selection-text="noSelectionText"
                    :options="options"
                />
            </Form>

            <template #controls>
                <HstText v-model="label" title="Label" />
                <HstText v-model="noSelectionText" title="No selection text" />
            </template>
        </Variant>

        <Variant title="Error">
            <Form :form="errorForm">
                <BaseSelect name="food" label="What's the best food?" :options="['Ramen', 'Pizza']" />
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
const noSelectionText = ref('Select one...');
const options = ['Ramen', 'Pizza'];
const hasErrors = ref(false);

errorForm.submit();

watchEffect(() => (hasErrors.value ? form.submit() : form.reset()));
</script>

<style>
.story-baseselect {
    grid-template-columns: repeat(1, 300px) !important;
}

.story-baseselect .variant {
    height: 300px;
}
</style>
