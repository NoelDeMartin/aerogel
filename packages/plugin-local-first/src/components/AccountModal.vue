<template>
    <Modal title-hidden close-hidden :title="$td('account.title', 'Account')">
        <div class="relative flex items-center rounded-md bg-gray-100 p-4 pr-12">
            <SolidAvatar class="mr-2 size-16 shrink-0" />
            <div class="flex flex-col overflow-hidden">
                <span class="font-semibold">{{ $solid.user?.name ?? $td('user.anonymous', 'Anonymous') }}</span>
                <Link :href="$solid.user?.webId" class="mt-0.5 truncate text-sm font-light text-gray-500">
                    {{ $solid.user?.webId }}
                </Link>
            </div>
            <Button
                size="icon"
                variant="ghost"
                class="absolute top-1 right-1 hover:bg-gray-200"
                :aria-label="$td('user.settings', 'Settings')"
                :title="$td('user.settings', 'Settings')"
                @click="$ui.modal(SettingsModal)"
            >
                <IconCog class="size-5" />
            </Button>
        </div>

        <div class="px-2">
            <div v-if="$cloud.syncing" class="mt-4 flex items-center gap-2">
                <IconRefresh class="mt-0.5 size-6 shrink-0 animate-spin self-start text-green-500" />
                <div class="flex w-full flex-col">
                    <Markdown lang-key="cloud.info.syncing" lang-default="Synchronizing..." />
                    <ProgressBar v-if="$cloud.syncJob" :job="$cloud.syncJob" filled-class="bg-green-500" />
                </div>
            </div>
            <div v-else-if="$solid.loginOngoing" class="mt-4 flex items-center gap-2">
                <IconRefresh class="mt-0.5 size-6 shrink-0 animate-spin self-start text-green-500" />
                <Markdown lang-key="cloud.info.reconnecting" lang-default="Reconnecting..." />
            </div>
            <div v-else-if="error" class="mt-4 flex items-center gap-2">
                <IconWarning class="mt-0.5 size-6 shrink-0 self-start text-red-500" />
                <div>
                    <Markdown :text="errorDescription" />
                    <Link
                        v-if="showErrorDetails"
                        class="text-sm text-red-700 opacity-50 hover:opacity-75 focus-visible:opacity-75"
                        @click="$errors.inspect(error)"
                    >
                        {{ $td('errors.viewDetails', 'View details') }}
                    </Link>
                </div>
            </div>
            <div v-else-if="!$cloud.ready" class="mt-4 flex items-center gap-2">
                <IconWarning class="mt-0.5 size-6 shrink-0 self-start text-yellow-500" />
                <Markdown lang-key="cloud.info.setup" lang-default="Your data is not backed up yet." />
            </div>
            <div v-else-if="$cloud.dirty" class="mt-4 flex items-center gap-2">
                <IconWarning class="mt-0.5 size-6 shrink-0 self-start text-yellow-500" />
                <Markdown
                    lang-key="cloud.info.changes"
                    lang-default="Everything is up to date. | There is one local change. | There are {n} local changes."
                    :lang-params="$cloud.localChanges"
                />
            </div>
            <div v-else-if="$cloud.online || $cloud.offline" class="mt-4 flex items-center gap-2">
                <IconCheckmarkOutline
                    class="mt-0.5 size-6 shrink-0 self-start"
                    :class="{ 'text-green-500': $cloud.online, 'text-gray-700': $cloud.offline }"
                />
                <Markdown
                    v-if="$cloud.online"
                    lang-key="cloud.info.changes"
                    lang-default="Everything is up to date."
                    :lang-params="0"
                />
                <Markdown
                    v-else
                    lang-key="cloud.info.offline"
                    lang-default="Everything is up to date, but you're currently offline."
                />
            </div>
            <div v-else class="mt-4 flex items-center gap-2">
                <IconWarning class="mt-0.5 size-6 shrink-0 self-start text-yellow-500" />
                <Markdown
                    lang-key="cloud.info.disconnected"
                    lang-default="You are disconnected from your Solid account, all the changes you make will remain in your device."
                />
            </div>
            <AdvancedOptions class="mt-2">
                <ul class="flex flex-col gap-2">
                    <li>
                        <Checkbox
                            v-model="$solid.autoReconnect"
                            label-class="text-base"
                            :label="$td('cloud.advanced.reconnect', 'Reconnect on startup')"
                        />
                    </li>
                    <li>
                        <Checkbox
                            v-model="$cloud.startupSync"
                            label-class="text-base"
                            :label="$td('cloud.advanced.startupSync', 'Synchronize on startup')"
                        />
                    </li>
                    <li>
                        <Checkbox v-model="$cloud.pollingEnabled" label-class="text-base">
                            <div class="flex items-center">
                                <span aria-hidden="true">{{ pollingText[0] }}</span>
                                <EditableContent
                                    type="number"
                                    :text="`${$cloud.pollingMinutes}`"
                                    :aria-label="
                                        $td('cloud.advanced.pollingMinutes', 'Synchronization interval (in minutes)')
                                    "
                                    class="focus-within:border-primary-600 mx-1 -mb-px border-b"
                                    @update="$cloud.pollingMinutes = $event as number"
                                >
                                    {{ $cloud.pollingMinutes }}
                                </EditableContent>
                                <span v-if="pollingText.length > 1" aria-hidden="true">{{ pollingText[1] }}</span>
                            </div>
                        </Checkbox>
                    </li>
                </ul>
            </AdvancedOptions>
        </div>

        <div v-if="!$solid.loginOngoing" class="mt-4 flex flex-row-reverse justify-start gap-2">
            <Button
                v-if="$cloud.syncing"
                variant="secondary"
                :disabled="cancellingSync"
                @click="cancelSync()"
            >
                <IconStop class="size-5" />
                <span>{{
                    cancellingSync ? $td('cloud.stopping', 'Stopping...') : $td('cloud.stop', 'Stop synchronization')
                }}</span>
            </Button>
            <Button v-else-if="!$solid.isLoggedIn()" @click="$solid.reconnect({ force: true })">
                <IconRefresh class="size-5" />
                <span>{{ $td('cloud.reconnect', 'Reconnect') }}</span>
            </Button>
            <Button
                v-else-if="$cloud.ready"
                :disabled="$cloud.offline"
                @click="$cloud.sync({ refreshUserProfile: true })"
            >
                <IconRefresh class="size-5" />
                <span>{{ $td('cloud.sync', 'Synchronize') }}</span>
            </Button>
            <Button v-else @click="(($cloud.setupDismissed = false), close(), $cloud.manualSetup || $cloud.setup())">
                <IconCloudUpload class="size-5" />
                <span>{{ $td('cloud.setup.submit', 'Back up now') }}</span>
            </Button>
            <Button v-if="!$cloud.syncing" variant="secondary" @click="$solid.logout()">
                <IconLogout class="size-5" />
                <span>{{ $cloud.ready ? $td('cloud.logOut', 'Log out') : $td('cloud.disconnect', 'Disconnect') }}</span>
            </Button>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import IconCheckmarkOutline from '~icons/zondicons/checkmark-outline';
import IconCloudUpload from '~icons/ic/sharp-cloud-upload';
import IconCog from '~icons/zondicons/cog';
import IconLogout from '~icons/material-symbols/logout-rounded';
import IconRefresh from '~icons/zondicons/refresh';
import IconStop from '~icons/ic/baseline-stop';
import IconWarning from '~icons/ion/warning';

import {
    AdvancedOptions,
    Button,
    Checkbox,
    EditableContent,
    Link,
    Markdown,
    Modal,
    ProgressBar,
    SettingsModal,
    translateWithDefault,
    useEvent,
    useModal,
} from '@aerogel/core';
import { computed, ref } from 'vue';
import { Solid, SolidAvatar } from '@aerogel/plugin-solid';

import Cloud from '@aerogel/plugin-local-first/services/Cloud';

const { close } = useModal();
const cancellingSync = ref(false);
const pollingText = translateWithDefault('cloud.advanced.polling', 'Synchronize every {minutes} minutes', {
    minutes: '%%separator%%',
}).split('%%separator%%');
const error = computed(() => Solid.error ?? Cloud.syncError);
const errorDescription = computed(() => {
    if (!error.value) {
        return;
    }

    if (typeof error.value === 'string') {
        return error.value;
    }

    return translateWithDefault('cloud.info.error', 'There has been an error connecting.');
});
const showErrorDetails = computed(() => error.value && typeof error.value !== 'string');

async function cancelSync() {
    if (!Cloud.syncJob) {
        return;
    }

    cancellingSync.value = true;

    await Promise.race([Cloud.syncJob.cancel(), Cloud.syncJob.completed]);

    cancellingSync.value = false;
}

useEvent('auth:logout', close);
</script>
