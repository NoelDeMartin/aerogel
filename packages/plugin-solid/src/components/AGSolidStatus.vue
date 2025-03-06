<template>
    <div>
        <slot v-if="$solid.loginStale" name="login-stale">
            <AGMarkdown :text="$td('solid.loginStale', 'This is taking too long...')" />
        </slot>

        <slot v-if="$solid.loginOngoing" name="login-ongoing">
            <AGMarkdown :text="$td('ui.loading', 'Loading...')" />
        </slot>

        <slot v-else-if="$solid.isLoggedIn()" name="logged-in" :session="$solid.session">
            <div class="flex flex-col gap-3">
                <AGMarkdown
                    :text="
                        $td('solid.loggedIn', 'You are logged in as [{userName}]({userWebId})', {
                            userName: $solid.user.name ?? $solid.user.webId,
                            userWebId: $solid.user.webId,
                        })
                    "
                />
                <AGButton @click="$solid.logout()">
                    {{ $td('solid.logout', 'Logout') }}
                </AGButton>
            </div>
        </slot>

        <slot v-else name="logged-out">
            <div class="flex flex-col">
                <AGForm :form="form" class="flex" @submit="$solid.login(form.url)">
                    <AGInput
                        name="url"
                        :aria-label="$td('solid.url', 'Login url')"
                        :placeholder="$td('solid.placeholder', 'https://...')"
                    />
                    <AGButton v-if="showDevLogin" submit @click="form.url = 'dev'">
                        {{ $td('solid.devLogin', 'Dev login') }}
                    </AGButton>
                    <AGButton v-else submit>
                        {{ $td('solid.login', 'Login') }}
                    </AGButton>
                </AGForm>
                <AGButton v-if="$solid.wasLoggedIn()" class="mt-3" @click="$solid.reconnect({ force: true })">
                    {{ $td('solid.reconnect', 'Reconnect') }}
                </AGButton>
                <p
                    v-if="$solid.previousSession?.error || $solid.loginStartupError"
                    class="mt-1 self-center text-sm text-red-800"
                >
                    <AGMarkdown :text="$td('solid.previousLoginError', 'Previous login attempt failed')" inline />
                    <AGLink @click="$errors.inspect($solid.previousSession?.error || $solid.loginStartupError)">
                        ({{ $td('errors.viewDetails', 'View details') }})
                    </AGLink>
                </p>
            </div>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { AGButton, AGForm, AGInput, AGLink, AGMarkdown, App, requiredStringInput, useForm } from '@aerogel/core';
import { computed } from 'vue';

const form = useForm({ url: requiredStringInput() });
const showDevLogin = computed(() => App.development && (!form.url || form.url.trim().length === 0));
</script>
