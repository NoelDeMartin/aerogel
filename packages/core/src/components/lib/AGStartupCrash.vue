<template>
    <div class="grid grow place-items-center">
        <div class="flex flex-col items-center space-y-6 p-8">
            <h1 class="mt-2 text-center text-4xl font-medium text-red-600">
                {{ $td('startupCrash.title', 'Something went wrong!') }}
            </h1>
            <AGMarkdown
                :text="
                    $td(
                        'startupCrash.message',
                        'Something failed trying to start the application.\n\nHere\'s some things you can do:'
                    )
                "
                class="mt-4 text-center"
            />
            <div class="mt-4 flex flex-col space-y-4">
                <Button variant="destructive" @click="$app.reload()">
                    {{ $td('startupCrash.reload', 'Try again') }}
                </Button>
                <Button variant="destructive" @click="$errors.inspect($errors.startupErrors)">
                    {{ $td('startupCrash.inspect', 'View error details') }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import AGMarkdown from './AGMarkdown.vue';
import Button from '../ui/Button.vue';
</script>
