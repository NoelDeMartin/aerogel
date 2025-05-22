<template>
    <div class="grid grow place-items-center">
        <div class="flex flex-col items-center space-y-6 p-8">
            <h1 class="mt-2 text-center text-4xl font-medium text-red-600">
                {{ $td('startupCrash.title', 'Something went wrong!') }}
            </h1>
            <Markdown
                :text="
                    $td(
                        'startupCrash.message',
                        'Something failed trying to start the application.\n\nHere\'s some things you can do:'
                    )
                "
                class="mt-4 text-center"
            />
            <div class="mt-4 flex flex-col space-y-4">
                <Button variant="danger" @click="$app.reload()">
                    {{ $td('startupCrash.reload', 'Try again') }}
                </Button>
                <Button variant="danger" @click="$errors.inspect($errors.startupErrors)">
                    {{ $td('startupCrash.inspect', 'View error details') }}
                </Button>
                <Button variant="danger" @click="purgeDevice()">
                    {{ $td('startupCrash.purge', 'Purge device') }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
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
