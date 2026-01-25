<template>
    <div class="grid grow place-items-center">
        <div class="flex flex-col items-center p-8">
            <IconExclamationSolid class="size-20 text-red-600" />
            <h1 class="mb-0 mt-0 text-center text-4xl font-medium text-red-600">
                {{ $td('startupCrash.title', 'Oops, something went wrong!') }}
            </h1>
            <Markdown
                :text="
                    $td(
                        'startupCrash.message',
                        'There was a problem starting the application, but here\'s some things you can do:'
                    )
                "
                class="mt-4 text-center"
            />
            <div
                class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 [&_button]:justify-start sm:[&_button]:size-32 sm:[&_button]:flex-col sm:[&_button]:justify-center [&_svg]:size-6 sm:[&_svg]:size-8"
            >
                <Button variant="danger" @click="$app.reload()">
                    <IconRefresh />
                    {{ $td('startupCrash.reload', 'Try again') }}
                </Button>
                <Button variant="danger" @click="$errors.inspect($errors.startupErrors)">
                    <IconBug />
                    {{ $td('startupCrash.inspect', 'View error details') }}
                </Button>
                <Button variant="danger" @click="purgeDevice()">
                    <IconDelete />
                    {{ $td('startupCrash.purge', 'Purge device') }}
                </Button>
                <Button variant="danger" @click="$errors.debug = !$errors.debug">
                    <IconFrameInspect />
                    {{ $td('startupCrash.debug', 'Toggle debugging') }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import IconBug from '~icons/material-symbols/bug-report';
import IconDelete from '~icons/material-symbols/delete-forever-rounded';
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';
import IconFrameInspect from '~icons/material-symbols/frame-inspect';
import IconRefresh from '~icons/material-symbols/refresh-rounded';

import App from '@aerogel/core/services/App';
import Button from '@aerogel/core/components/ui/Button.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Storage from '@aerogel/core/services/Storage';
import UI from '@aerogel/core/ui/UI';
import { translateWithDefault } from '@aerogel/core/lang/utils';

async function purgeDevice() {
    const confirmed = await UI.confirm(
        translateWithDefault('startupCrash.purgeConfirmTitle', 'Delete everything?'),
        translateWithDefault(
            'startupCrash.purgeConfirmMessage',
            'If the problem persists, one drastic solution may be to wipe the storage in this device ' +
                'to start from scratch. However, keep in mind that **all the data that you haven\'t ' +
                'synchronized will be deleted forever**.\n\nDo you still want to proceed?',
        ),
        {
            acceptVariant: 'danger',
            acceptText: translateWithDefault('startupCrash.purgeConfirmAccept', 'Purge device'),
        },
    );

    if (!confirmed) {
        return;
    }

    await Storage.purge();
    await App.reload();
}
</script>
