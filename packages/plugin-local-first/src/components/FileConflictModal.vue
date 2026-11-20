<template>
    <!-- @vue-generic {import('soukai-bis').FileConflictResolution} -->
    <Modal v-slot="{ close }" :title="title" persistent>
        <Markdown :text="message" />

        <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <FileConflictDownloadButton v-if="conflict.type !== 'deleted-locally'" :url="conflict.url" version="local">
                {{ prompt?.downloadLocalText ?? downloadLocalText }}
            </FileConflictDownloadButton>
            <FileConflictDownloadButton
                v-if="conflict.type !== 'deleted-remotely'"
                :url="conflict.url"
                version="remote"
            >
                {{ prompt?.downloadRemoteText ?? downloadRemoteText }}
            </FileConflictDownloadButton>
        </div>

        <div class="mt-4 flex flex-row-reverse gap-2">
            <Button :variant="prompt?.keepLocalVariant ?? keepLocalButton.variant" @click="close('keep-local')">
                {{ prompt?.keepLocalText ?? keepLocalButton.text }}
            </Button>
            <Button :variant="prompt?.keepRemoteVariant ?? keepRemoteButton.variant" @click="close('keep-remote')">
                {{ prompt?.keepRemoteText ?? keepRemoteButton.text }}
            </Button>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { Button, Markdown, Modal, translateWithDefault } from '@aerogel/core';
import type { ButtonVariant } from '@aerogel/core';
import FileConflictDownloadButton from '@aerogel/plugin-local-first/components/FileConflictDownloadButton.vue';
import type { FileConflictPrompt } from '@aerogel/plugin-local-first/services/Cloud';
import type { FileConflict, FileConflictResolution } from 'soukai-bis';
import { computed } from 'vue';

const { conflict, prompt = null } = defineProps<{
    conflict: FileConflict;
    prompt?: FileConflictPrompt | null;
}>();

defineEmits<{ close: [result: FileConflictResolution] }>();

const deleteButton = computed(() => ({
    text: translateWithDefault('cloud.fileConflict.delete', 'Delete'),
    variant: 'danger' as ButtonVariant,
}));
const restoreButton = computed(() => ({
    text: translateWithDefault('cloud.fileConflict.restore', 'Restore'),
    variant: 'secondary' as ButtonVariant,
}));
const keepLocalButton = computed(() => {
    switch (conflict.type) {
        case 'modified-remotely':
            return {
                text: translateWithDefault('cloud.fileConflict.keepLocal', 'Keep this version'),
                variant: 'default' as ButtonVariant,
            };
        case 'deleted-remotely':
            return restoreButton.value;
        case 'deleted-locally':
            return deleteButton.value;
    }
});
const keepRemoteButton = computed(() => {
    switch (conflict.type) {
        case 'modified-remotely':
            return {
                text: translateWithDefault('cloud.fileConflict.keepRemote', 'Keep the other version'),
                variant: 'secondary' as ButtonVariant,
            };
        case 'deleted-remotely':
            return deleteButton.value;
        case 'deleted-locally':
            return restoreButton.value;
    }
});
const downloadLocalText = computed(() =>
    conflict.type === 'modified-remotely'
        ? translateWithDefault('cloud.fileConflict.downloadLocal', 'Download this version')
        : translateWithDefault('cloud.fileConflict.download', 'Download file'),
);
const downloadRemoteText = computed(() =>
    conflict.type === 'modified-remotely'
        ? translateWithDefault('cloud.fileConflict.downloadRemote', 'Download the other version')
        : translateWithDefault('cloud.fileConflict.download', 'Download file'),
);
const title = computed(() => {
    if (prompt?.title) {
        return prompt.title;
    }

    return conflict.type === 'deleted-remotely'
        ? translateWithDefault('cloud.fileConflict.deletedRemotelyTitle', 'Deleted on another device')
        : translateWithDefault('cloud.fileConflict.modifiedRemotelyTitle', 'Changed on another device');
});
const message = computed(() => {
    if (prompt?.message) {
        return prompt.message;
    }

    const file = `\`${conflict.url}\``;

    switch (conflict.type) {
        case 'modified-remotely':
            return translateWithDefault(
                'cloud.fileConflict.modifiedRemotely',
                'The file at {file} was changed on another device, but it also has changes on this device that ' +
                    'have not been synchronized yet. Which version do you want to keep?',
                { file },
            );
        case 'deleted-remotely':
            return translateWithDefault(
                'cloud.fileConflict.deletedRemotely',
                'The file at {file} was deleted on another device, but it has changes on this device that have ' +
                    'not been synchronized yet. Do you want to delete it, or restore it with your changes?',
                { file },
            );
        case 'deleted-locally':
            return translateWithDefault(
                'cloud.fileConflict.deletedLocally',
                'You deleted the file at {file} on this device, but it was changed on another device in the ' +
                    'meantime. Do you want to delete it, or restore it with those changes?',
                { file },
            );
    }
});
</script>
