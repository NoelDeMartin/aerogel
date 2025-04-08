<template>
    <DropdownMenu
        :options="[{ label: $td('user.logIn', 'Connect account'), click: () => $ui.openModal(AccountLoginModal) }]"
    >
        <Button
            size="icon"
            variant="ghost"
            :aria-label="$td('user.menu', 'Configuration')"
            :title="$td('user.menu', 'Configuration')"
        >
            <IconCog class="size-5" />
        </Button>
    </DropdownMenu>
</template>

<script setup lang="ts">
import IconCog from '~icons/zondicons/cog';

import { Button, DropdownMenu } from '@aerogel/core';

import AccountLoginModal from './AccountLoginModal.vue';
</script>
