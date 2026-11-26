<template>
    <Button
        variant="link"
        size="small"
        class="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
        :loading
        @click="download()"
    >
        <IconDownload v-if="!loading" class="size-3" />
        <slot />
    </Button>
</template>

<script setup lang="ts">
import { Button, Errors, translateWithDefault, useLoading } from '@aerogel/core';
import { urlFileName } from '@noeldemartin/utils';
import { requireLocalEngine, requireRemoteEngine } from 'soukai-bis';
import IconDownload from '~icons/zondicons/download';

const { url, version } = defineProps<{
    url: string;
    version: 'local' | 'remote';
}>();

const { loading, run } = useLoading({ delay: 300 });

async function download(): Promise<void> {
    try {
        await run(async () => {
            const engine = version === 'local' ? requireLocalEngine() : requireRemoteEngine();
            const blob = await engine.readFile(url);

            downloadBlob(getFileName(), blob);
        });
    } catch (error) {
        await Errors.report(error, translateWithDefault('cloud.fileConflict.downloadFailed', 'Download failed'));
    }
}

function getFileName(): string {
    const fileName = urlFileName(url);
    const extensionIndex = fileName.lastIndexOf('.');
    const suffix =
        version === 'local'
            ? translateWithDefault('cloud.fileConflict.localSuffix', 'this device')
            : translateWithDefault('cloud.fileConflict.remoteSuffix', 'other device');

    return extensionIndex > 0
        ? `${fileName.slice(0, extensionIndex)} (${suffix})${fileName.slice(extensionIndex)}`
        : `${fileName} (${suffix})`;
}

function downloadBlob(fileName: string, blob: Blob): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
</script>
