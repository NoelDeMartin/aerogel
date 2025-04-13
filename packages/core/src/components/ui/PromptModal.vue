<template>
    <!-- @vue-generic {import('@aerogel/core/ui/UI').ModalExposeResult<PromptModalExpose>} -->
    <Modal v-slot="{ close }" :title="renderedTitle" persistent>
        <Form :form @submit="close(form.draft)">
            <Markdown v-if="renderedMessage" :text="renderedMessage" />
            <Input
                name="draft"
                class="mt-2"
                :placeholder
                :label
            />

            <div class="mt-4 flex flex-row-reverse gap-2">
                <Button :variant="acceptVariant" submit>
                    {{ renderedAcceptText }}
                </Button>
                <Button :variant="cancelVariant" @click="close()">
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
import type { PromptModalExpose, PromptModalProps } from '@aerogel/core/components/contracts/PromptModal';

const { cancelVariant = 'secondary', ...props } = defineProps<PromptModalProps>();
const { form, renderedTitle, renderedMessage, renderedAcceptText, renderedCancelText } = usePromptModal(props);

defineExpose<PromptModalExpose>();
</script>
