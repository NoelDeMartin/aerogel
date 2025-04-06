<template>
    <Modal v-slot="{ close }" :title="title" persistent>
        <Form :form="form" @submit="close(form.draft)">
            <Markdown :text="message" />
            <Input
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
        </Form>
    </Modal>
</template>

<script setup lang="ts">
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import Button from '@aerogel/core/components/ui/Button.vue';
import Form from '@aerogel/core/components/ui/Form.vue';
import Input from '@aerogel/core/components/ui/Input.vue';
import Modal from '@aerogel/core/components/ui/Modal.vue';
import { usePromptModal } from '@aerogel/core/components/contracts/PromptModal';
import type { PromptModalProps } from '@aerogel/core/components/contracts/PromptModal';

const { cancelVariant = 'secondary', ...props } = defineProps<PromptModalProps>();
const { form, renderedAcceptText, renderedCancelText } = usePromptModal(props);
</script>
