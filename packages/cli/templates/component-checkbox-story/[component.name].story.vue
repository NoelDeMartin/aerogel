<template>
    <Story group="base" :layout="{ type: 'grid' }">
        <Variant title="Playground">
            <Form :form class="m-1">
                <<% component.name %> name="accept" :form>
                    {{ label }}
                </<% component.name %>>
            </Form>

            <template #controls>
                <HstText v-model="label" title="Label" />
            </template>
        </Variant>

        <Variant title="Default">
            <<% component.name %> class="m-1">
                Accept Terms & Conditions
            </<% component.name %>>
        </Variant>

        <Variant title="Hover">
            <<% component.name %> class="m-1" input-class=":hover">
                Accept Terms & Conditions
            </<% component.name %>>
        </Variant>

        <Variant title="Focus">
            <<% component.name %> class="m-1" input-class=":focus :focus-visible">
                Accept Terms & Conditions
            </<% component.name %>>
        </Variant>

        <Variant title="Error">
            <Form :form="errorForm" class="m-1">
                <<% component.name %> name="accept">
                    Accept Terms & Conditions
                </<% component.name %>>
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
.story-<% component.slug %> {
    grid-template-columns: repeat(2, 300px) !important;
}

.story-<% component.slug %> .variant-playground {
    grid-column: 1 / -1;
}
</style>
