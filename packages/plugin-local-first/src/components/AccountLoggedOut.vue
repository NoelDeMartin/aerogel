<template>
    <DropdownMenu
        align="start"
        :options="[
            { label: $td('user.logIn', 'Connect account'), click: () => $ui.modal(AccountLoginModal) },
            { label: $td('user.settings', 'Settings'), click: () => $ui.modal(SettingsModal) },
        ]"
    >
        <Button
            size="icon"
            variant="ghost"
            :title="$td('user.menu', 'Configuration')"
        >
            <IconCog class="size-5" />
            <span class="sr-only">{{ $td('user.menu', 'Configuration') }}</span>
        </Button>
    </DropdownMenu>
</template>

<script setup lang="ts">
import IconCog from '~icons/zondicons/cog';

import { Button, DropdownMenu, SettingsModal } from '@aerogel/core';

import AccountLoginModal from './AccountLoginModal.vue';
</script>
