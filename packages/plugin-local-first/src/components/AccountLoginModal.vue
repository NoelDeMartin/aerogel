<template>
    <Modal :title="$td('cloud.logIn.title', 'Connect account')">
        <Form :form @submit="$solid.login(form.url)">
            <Markdown
                lang-key="cloud.logIn.info"
                lang-default="Log in to your [Solid account](https://solidproject.org) to keep data safe across devices."
            />
            <Link
                class="mt-2 text-sm opacity-50 hover:opacity-75 focus-visible:opacity-75"
                @click="
                    $ui.alert(
                        $td('cloud.logIn.learnMore', 'What is Solid?'),
                        $td(
                            'cloud.logIn.learnMoreMessage',
                            'Solid is a decentralized storage protocol built on top of web standards. ' +
                                'If you want to use this app across devices, ' +
                                'you can use Solid to keep changes in sync. ' +
                                'Even if you use it in a single device, ' +
                                'this will also keep your data secure in case your device is lost.\n\n' +
                                'In any case, Focus works 100% offline and you can connect your Solid POD later on. ' +
                                'If you\'ve never heard of Solid and you\'re just trying things out, ' +
                                'you can keep using it without an account.\n\n' +
                                '[Learn more](https://solidproject.org)'
                        )
                    )
                "
            >
                {{ $td('cloud.logIn.learnMore', 'What is Solid?') }}
            </Link>
            <div class="mt-4 flex flex-col items-center gap-2 md:flex-row">
                <Input
                    name="url"
                    :aria-label="$td('cloud.logIn.label', 'Login url')"
                    :placeholder="$td('cloud.logIn.placeholder', 'https://me.solidcommunity.net')"
                    class="w-96 max-w-full"
                />
                <Button
                    v-if="showDevLogin"
                    submit
                    class="w-full whitespace-nowrap md:w-auto"
                    @click="form.url = 'dev'"
                >
                    {{ $td('cloud.logIn.dev', 'Log in to dev server') }}
                </Button>
                <Button v-else submit class="w-full md:w-auto">
                    {{ $td('cloud.logIn.submit', 'Log in') }}
                </Button>
            </div>
        </Form>
    </Modal>
</template>

<script setup lang="ts">
import { App, Button, Form, Input, Link, Markdown, Modal, requiredStringInput, useForm } from '@aerogel/core';
import { computed } from 'vue';

const form = useForm({ url: requiredStringInput() });
const showDevLogin = computed(
    () => App.development && (!form.url || form.url === 'dev' || form.url.trim().length === 0),
);
</script>
