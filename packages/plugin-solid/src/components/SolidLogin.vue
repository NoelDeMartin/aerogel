<template>
    <Form :form class="flex flex-col items-center gap-2 md:flex-row" @submit="$solid.login(form.url)">
        <Input
            name="url"
            :aria-label="$td('solid.logIn.label', 'Login url')"
            :placeholder="$td('solid.logIn.placeholder', 'https://me.solidcommunity.net')"
            class="w-96 max-w-full"
        />
        <Button
            v-if="showDevLogin"
            submit
            class="w-full whitespace-nowrap md:w-auto"
            @click="form.url = 'dev'"
        >
            {{ $td('solid.logIn.dev', 'Log in to dev server') }}
        </Button>
        <Button v-else submit class="w-full md:w-auto">
            {{ $td('solid.logIn.submit', 'Log in') }}
        </Button>
    </Form>
</template>

<script setup lang="ts">
import { App, Button, Form, Input, requiredStringInput, useForm } from '@aerogel/core';
import { computed } from 'vue';

const form = useForm({ url: requiredStringInput() });
const showDevLogin = computed(
    () => App.development && (!form.url || form.url === 'dev' || form.url.trim().length === 0),
);
</script>
