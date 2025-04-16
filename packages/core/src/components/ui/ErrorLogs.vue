<template>
    <Button
        v-if="$errors.logs.length > 0"
        size="icon"
        variant="ghost"
        :title="$td('errors.viewLogs', 'View error logs')"
        :aria-label="$td('errors.viewLogs', 'View error logs')"
        @click="$ui.modal(ErrorLogsModal)"
    >
        <IconWarning class="size-6 text-red-500" />
    </Button>
</template>

<script setup lang="ts">
import IconWarning from '~icons/ion/warning';

import Button from '@aerogel/core/components/ui/Button.vue';
import ErrorLogsModal from '@aerogel/core/components/ui/ErrorLogsModal.vue';
</script>
