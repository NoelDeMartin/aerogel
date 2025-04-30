<template>
    <Page class="justify-center">
        <h2 class="text-2xl font-bold">
            {{ $td('not-found.title', '404: Not Found') }}
        </h2>

        <Link route="home">
            {{ $td('not-found.home', 'Go home') }}
        </Link>
    </Page>
</template>

<script setup lang="ts">
import { Link } from '@aerogel/core';

import Page from '@aerogel/plugin-routing/components/Page.vue';
</script>
