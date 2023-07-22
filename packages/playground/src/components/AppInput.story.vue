<template>
    <Story>
        <Variant title="Primary">
            <div class="prose">
                <h2>Valid</h2>
                <StateVariants level="3">
                    <AppInput :label="label" :placeholder="placeholder" />
                    <template #focus>
                        <AppInput class=":focus :focus-visible" :label="label" :placeholder="placeholder" />
                    </template>
                </StateVariants>

                <h2>Error</h2>
                <StateVariants level="3">
                    <AGForm :form="form">
                        <AppInput name="food" :label="label" :placeholder="placeholder" />
                    </AGForm>
                    <template #focus>
                        <AGForm :form="form">
                            <AppInput
                                name="food"
                                class=":focus :focus-visible"
                                :label="label"
                                :placeholder="placeholder"
                            />
                        </AGForm>
                    </template>
                </StateVariants>
            </div>

            <template #controls>
                <HstText v-model="label" title="Label" />
                <HstText v-model="placeholder" title="Placeholder" />
            </template>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { requiredStringInput, useForm } from '@aerogel/core';
import { ref } from 'vue';

const form = useForm({ food: requiredStringInput() });
const label = ref('Best food');
const placeholder = ref('Ramen');

form.submit();
</script>
