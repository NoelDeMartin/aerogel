<template>
    <Story>
        <Variant title="Primary">
            <StateVariants>
                <CoreButton>
                    {{ content }}
                </CoreButton>

                <template #hover>
                    <CoreButton class=":hover">
                        {{ content }}
                    </CoreButton>
                </template>

                <template #focus>
                    <CoreButton class=":focus :focus-visible">
                        {{ content }}
                    </CoreButton>
                </template>
            </StateVariants>

            <template #controls>
                <HstText v-model="content" title="Content" />
            </template>
        </Variant>
    </Story>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const content = ref('Click me!');
</script>
