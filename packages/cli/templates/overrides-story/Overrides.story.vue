<template>
    <Story :layout="{ type: 'grid', width: '90%' }">
        <Variant title="Playground">
            <div class="flex space-x-3">
                <Button @click="$ui.alert(alertTitle, alertMessage)">
                    Alert
                </Button>
                <Button @click="$ui.confirm(confirmTitle, confirmMessage)">
                    Confirm
                </Button>
                <Button @click="$ui.loading(loadingMessage, after({ seconds: loadingDuration }))">
                    Loading
                </Button>
                <Button @click="$ui.showSnackbar(snackbarMessage, snackbarOptions)">
                    Snackbar
                </Button>
                <Button @click="$errors.inspect(errorReports)">
                    Error Report
                </Button>
            </div>

            <AppOverlays />

            <template #controls>
                <HstText v-model="alertTitle" title="Alert Title" />
                <HstText v-model="alertMessage" title="Alert Message" />
                <HstText v-model="confirmTitle" title="Confirm Title" />
                <HstText v-model="confirmMessage" title="Confirm Message" />
                <HstText v-model="loadingMessage" title="Loading Message" />
                <HstNumber v-model="loadingDuration" title="Loading Duration" />
                <HstText v-model="snackbarMessage" title="Snackbar Message" />
                <HstSelect v-model="snackbarColor" title="Snackbar Color" :options="snackbarColors" />
                <HstText v-model="snackbarAction" title="Snackbar Action" />
                <HstText v-model="errorReportTitle" title="Error Report Title" />
                <HstText v-model="errorReportDescription" title="Error Report Description" />
            </template>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { after, invert } from '@noeldemartin/utils';
import { Colors, SnackbarColors } from '@aerogel/core';
import type { ErrorReport, ShowSnackbarOptions } from '@aerogel/core';

const alertTitle = ref('Something important happened');
const alertMessage = ref('And here you can read the details...');
const confirmTitle = ref('Confirmation');
const confirmMessage = ref('Are you sure?');
const loadingMessage = ref('Loading...');
const loadingDuration = ref(3);
const snackbarMessage = ref('Something happened');
const snackbarColor = ref(Colors.Secondary);
const snackbarColors = invert(SnackbarColors);
const snackbarAction = ref('Ok');
const snackbarOptions = computed((): ShowSnackbarOptions => {
    if (!snackbarAction.value) {
        return {};
    }

    return {
        color: snackbarColor.value,
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
const errorReports = computed((): ErrorReport[] => [
    {
        title: errorReportTitle.value,
        description: errorReportDescription.value,
        details: new Error().stack,
    },
    {
        title: errorReportTitle.value,
        description: errorReportDescription.value,
        details: new Error().stack,
    },
]);
</script>
