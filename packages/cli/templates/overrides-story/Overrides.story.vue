<template>
    <Story>
        <div class="flex space-x-3">
            <AGButton @click="$ui.alert(alertTitle, alertMessage)">
                Alert
            </AGButton>
            <AGButton @click="$ui.confirm(confirmTitle, confirmMessage)">
                Confirm
            </AGButton>
            <AGButton @click="$ui.loading(after({ seconds: loadingDuration }))">
                Loading
            </AGButton>
            <AGButton @click="$ui.showSnackbar(snackbarMessage, snackbarOptions)">
                Snackbar
            </AGButton>
            <AGButton @click="$errors.inspect(errorReport)">
                Error Report
            </AGButton>
        </div>

        <AGAppOverlays />

        <template #controls>
            <HstText v-model="alertTitle" title="Alert Title" />
            <HstText v-model="alertMessage" title="Alert Message" />
            <HstText v-model="confirmTitle" title="Confirm Title" />
            <HstText v-model="confirmMessage" title="Confirm Message" />
            <HstNumber v-model="loadingDuration" title="Loading Duration" />
            <HstText v-model="snackbarMessage" title="Snackbar Message" />
            <HstText v-model="snackbarAction" title="Snackbar Action" />
            <HstText v-model="errorReportTitle" title="Error Report Title" />
            <HstText v-model="errorReportDescription" title="Error Report Description" />
        </template>
    </Story>
</template>

<script setup lang="ts">
import type { ErrorReport, ShowSnackbarOptions } from '@aerogel/core';
import { computed, ref } from 'vue';
import { after } from '@noeldemartin/utils';

const alertTitle = ref('Something important happened');
const alertMessage = ref('And here you can read the details...');
const confirmTitle = ref('Confirmation');
const confirmMessage = ref('Are you sure?');
const loadingDuration = ref(3);
const snackbarMessage = ref('Something happened');
const snackbarAction = ref('Ok');
const snackbarOptions = computed((): ShowSnackbarOptions => {
    if (!snackbarAction.value) {
        return {};
    }

    return {
        actions: [
            {
                text: snackbarAction.value,
                dismiss: true,
            },
        ],
    };
});
const errorReportTitle = ref('Error');
const errorReportDescription = ref('Something went wrong!');
const errorReport = computed((): ErrorReport[] => [
    {
        title: errorReportTitle.value,
        description: errorReportDescription.value,
        details: new Error().stack,
    },
]);
</script>
