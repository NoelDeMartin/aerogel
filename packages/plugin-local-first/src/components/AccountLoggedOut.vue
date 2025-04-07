<template>
    <Button
        size="icon"
        variant="ghost"
        :aria-label="$td('user.menu', 'Configuration')"
        :title="$td('user.menu', 'Configuration')"
        @click="$ui.openModal(AccountLoginModal)"
    >
        <IconCog class="size-5" />
    </Button>
</template>

<script setup lang="ts">
import IconCog from '~icons/zondicons/cog';

import { Button } from '@aerogel/core';

import AccountLoginModal from './AccountLoginModal.vue';
</script>
