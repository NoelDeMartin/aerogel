<template>
    <Modal v-slot="{ close }" :title="title" persistent>
        <AGForm :form="form" @submit="close(form.draft)">
            <AGMarkdown :text="message" />
            <AGInput
                name="draft"
                class="mt-2"
                :placeholder="placeholder"
                :label="label"
            />

            <div class="mt-4 flex flex-row-reverse gap-2">
                <Button :variant="acceptVariant" submit>
                    {{ renderedAcceptText }}
                </Button>
                <Button :variant="cancelVariant" @click="close(false)">
                    {{ renderedCancelText }}
                </Button>
            </div>
        </AGForm>
    </Modal>
</template>

<script setup lang="ts">
import AGForm from '@aerogel/core/components/forms/AGForm.vue';
import AGInput from '@aerogel/core/components/forms/AGInput.vue';
import AGMarkdown from '@aerogel/core/components/lib/AGMarkdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import { usePromptModal } from '@aerogel/core/components/contracts/PromptModal';
import type { IPromptModalProps } from '@aerogel/core/components/contracts/PromptModal';

const { cancelVariant = 'secondary', ...props } = defineProps<IPromptModalProps>();
const { form, renderedAcceptText, renderedCancelText } = usePromptModal(props);
</script>
