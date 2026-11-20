import { Events } from '@aerogel/core';
import Solid from '@aerogel/plugin-solid/services/Solid';
import type { ReadFileOptions } from '@aerogel/plugin-solid/services/Solid';
import { silenced } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import { getCurrentScope, onScopeDispose, readonly, ref, shallowRef, toValue, watch } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';

// oxlint-disable typescript/explicit-module-boundary-types
export function useSolidFile(fileUrl: MaybeRefOrGetter<Nullable<string>>, options: ReadFileOptions = {}) {
    let currentLoad = 0;
    const objectUrl = ref<string>();
    const blob = shallowRef<Blob | null>(null);
    const loading = ref(false);

    function revokeObjectUrl(): void {
        objectUrl.value && URL.revokeObjectURL(objectUrl.value);
        objectUrl.value = undefined;
    }

    function clearFile(): void {
        currentLoad++;
        revokeObjectUrl();
        blob.value = null;
        loading.value = false;
    }

    async function load(url: Nullable<string>): Promise<void> {
        if (!url) {
            clearFile();

            return;
        }

        const loadId = ++currentLoad;

        loading.value = true;

        try {
            const fileBlob = await silenced(Solid.readFileIfExists(url, options));

            if (loadId !== currentLoad) {
                return;
            }

            revokeObjectUrl();

            blob.value = fileBlob;
            objectUrl.value = fileBlob ? URL.createObjectURL(fileBlob) : undefined;
        } finally {
            if (loadId === currentLoad) {
                loading.value = false;
            }
        }
    }

    function reloadFile({ url }: { url: string }): void {
        if (url !== toValue(fileUrl)) {
            return;
        }

        void load(url);
    }

    function forgetFile({ url }: { url: string }): void {
        if (url !== toValue(fileUrl)) {
            return;
        }

        clearFile();
    }

    const stopListeners = [
        Events.on('solid:file-uploaded', reloadFile),
        Events.on('solid:file-updated', reloadFile),
        Events.on('solid:file-deleted', forgetFile),
    ];

    watch(() => toValue(fileUrl), load, { immediate: true });

    getCurrentScope() &&
        onScopeDispose(() => {
            currentLoad++;
            stopListeners.forEach((stop) => stop());
            revokeObjectUrl();
        });

    return {
        url: readonly(objectUrl),
        blob: readonly(blob) as Readonly<Ref<Blob | null>>,
        loading: readonly(loading),
    };
}
