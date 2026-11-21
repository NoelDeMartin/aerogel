<template>
    <!-- @vue-generic {import('soukai-bis').DeletionConflictResolution} -->
    <Modal v-slot="{ close }" :title="title" persistent>
        <Markdown :text="message" />

        <div class="mt-4 flex flex-row-reverse gap-2">
            <Button :variant="prompt?.deleteVariant ?? 'danger'" @click="close('delete')">
                {{ prompt?.deleteText ?? $td('cloud.deletionConflict.delete', 'Delete') }}
            </Button>
            <Button :variant="prompt?.restoreVariant ?? 'secondary'" @click="close('restore')">
                {{ prompt?.restoreText ?? $td('cloud.deletionConflict.restore', 'Restore') }}
            </Button>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { Button, Markdown, Modal, translateWithDefault } from '@aerogel/core';
import type { DeletionConflictPrompt } from '@aerogel/plugin-local-first/services/Cloud';
import { stringSplitWords } from '@noeldemartin/utils';
import type { DeletionConflict, DeletionConflictResolution } from 'soukai-bis';
import { computed } from 'vue';

const { conflict, prompt = null } = defineProps<{
    conflict: DeletionConflict;
    prompt?: DeletionConflictPrompt | null;
}>();

defineEmits<{ close: [result: DeletionConflictResolution] }>();

const modelName = computed(() => {
    const name = conflict.model?.static().modelName;

    return name
        ? translateWithDefault(`models.${name}`, stringSplitWords(name).join(' ').toLowerCase())
        : translateWithDefault('cloud.deletionConflict.resource', 'resource');
});
const item = computed(() => `${modelName.value} at \`${conflict.resourceUrl}\``);
const title = computed(() => {
    if (prompt?.title) {
        return prompt.title;
    }

    return conflict.type === 'deleted-remotely'
        ? translateWithDefault('cloud.deletionConflict.deletedRemotelyTitle', 'Deleted on another device')
        : translateWithDefault('cloud.deletionConflict.deletedLocallyTitle', 'Changed on another device');
});
const message = computed(() => {
    if (prompt?.message) {
        return prompt.message;
    }

    return conflict.type === 'deleted-remotely'
        ? translateWithDefault(
              'cloud.deletionConflict.deletedRemotely',
              'The {item} was deleted on another device, but it has changes on this device that have not been ' +
                  'synchronized yet. Do you want to delete it, or restore it with your changes?',
              { item: item.value },
          )
        : translateWithDefault(
              'cloud.deletionConflict.deletedLocally',
              'You deleted the {item} on this device, but it was changed on another device in the meantime. ' +
                  'Do you want to delete it, or restore it with those changes?',
              { item: item.value },
          );
});
</script>
