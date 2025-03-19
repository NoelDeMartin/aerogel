<template>
    <AccountLoggedIn v-if="$solid.hasLoggedIn()" />
    <AccountLoggedOut v-else />
</template>

<script setup lang="ts">
import AccountLoggedIn from './AccountLoggedIn.vue';
import AccountLoggedOut from './AccountLoggedOut.vue';
</script>
