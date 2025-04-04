<template>
    <Story group="base" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <Form :form="form" class="m-1">
                <BaseCheckbox name="accept" :form="form">
                    {{ label }}
                </BaseCheckbox>
            </Form>

            <template #controls>
                <HstText v-model="label" title="Label" />
            </template>
        </Variant>

        <Variant title="Default">
            <BaseCheckbox class="m-1">
                Accept Terms & Conditions
            </BaseCheckbox>
        </Variant>

        <Variant title="Hover">
            <BaseCheckbox class="m-1" input-class=":hover">
                Accept Terms & Conditions
            </BaseCheckbox>
        </Variant>

        <Variant title="Focus">
            <BaseCheckbox class="m-1" input-class=":focus :focus-visible">
                Accept Terms & Conditions
            </BaseCheckbox>
        </Variant>

        <Variant title="Error">
            <Form :form="errorForm" class="m-1">
                <BaseCheckbox name="accept">
                    Accept Terms & Conditions
                </BaseCheckbox>
            </Form>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { requiredBooleanInput, useForm } from '@aerogel/core';
import { ref } from 'vue';

const form = useForm({ accept: requiredBooleanInput(true) });
const errorForm = useForm({ accept: requiredBooleanInput() });
const label = ref('Accept Terms & Conditions');

form.submit();
errorForm.submit();
</script>

<style>
.story-basecheckbox {
    grid-template-columns: repeat(2, 300px) !important;
}

.story-basecheckbox .variant-playground {
    grid-column: 1 / -1;
}
</style>
