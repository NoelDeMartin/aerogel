<template>
    <div>
        <slot v-if="$solid.loginStale" name="login-stale">
            <Markdown :text="$td('solid.loginStale', 'This is taking too long...')" />
        </slot>

        <slot v-if="$solid.loginOngoing" name="login-ongoing">
            <Markdown :text="$td('ui.loading', 'Loading...')" />
        </slot>

        <slot v-else-if="$solid.isLoggedIn()" name="logged-in" :session="$solid.session">
            <div class="flex flex-col gap-3">
                <Markdown
                    :text="
                        $td('solid.loggedIn', 'You are logged in as [{userName}]({userWebId})', {
                            userName: $solid.user.name ?? $solid.user.webId,
                            userWebId: $solid.user.webId,
                        })
                    "
                />
                <Button @click="$solid.logout()">
                    {{ $td('solid.logout', 'Logout') }}
                </Button>
            </div>
        </slot>

        <slot v-else name="logged-out">
            <div class="flex flex-col">
                <Form :form="form" class="flex" @submit="$solid.login(form.url)">
                    <Input
                        name="url"
                        :aria-label="$td('solid.url', 'Login url')"
                        :placeholder="$td('solid.placeholder', 'https://...')"
                    />
                    <Button v-if="showDevLogin" submit @click="form.url = 'dev'">
                        {{ $td('solid.devLogin', 'Dev login') }}
                    </Button>
                    <Button v-else submit>
                        {{ $td('solid.login', 'Login') }}
                    </Button>
                </Form>
                <Button v-if="$solid.wasLoggedIn()" class="mt-3" @click="$solid.reconnect({ force: true })">
                    {{ $td('solid.reconnect', 'Reconnect') }}
                </Button>
                <p
                    v-if="$solid.previousSession?.error || $solid.loginStartupError"
                    class="mt-1 self-center text-sm text-red-800"
                >
                    <Markdown :text="$td('solid.previousLoginError', 'Previous login attempt failed')" inline />
                    <Link @click="$errors.inspect($solid.previousSession?.error || $solid.loginStartupError)">
                        ({{ $td('errors.viewDetails', 'View details') }})
                    </Link>
                </p>
            </div>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { Button, Form, Input, Link, Markdown, requiredStringInput, useForm } from '@aerogel/core';
import { isDevelopment } from '@noeldemartin/utils';
import { computed } from 'vue';

const form = useForm({ url: requiredStringInput() });
const showDevLogin = computed(
    () => isDevelopment() && (!form.url || form.url === 'dev' || form.url.trim().length === 0),
);
</script>
