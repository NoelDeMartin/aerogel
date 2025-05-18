<template>
    <Page class="items-center justify-center">
        <h2 class="text-2xl font-bold">
            {{ $td('notFound.title', '404: Not Found') }}
        </h2>

        <Link route="home">
            {{ $td('notFound.home', 'Go home') }}
        </Link>
    </Page>
</template>

<script setup lang="ts">
import { Link } from '@aerogel/core';

import Page from '@aerogel/plugin-routing/components/Page.vue';
</script>
