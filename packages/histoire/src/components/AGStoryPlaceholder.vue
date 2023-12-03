<template>
    <div class="relative overflow-hidden rounded-xl border border-dashed border-gray-400 opacity-75">
        <svg class="absolute inset-0 h-full w-full stroke-gray-900/10" fill="none">
            <defs>
                <pattern
                    :id="patternId"
                    x="0"
                    y="0"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                >
                    <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3" />
                </pattern>
            </defs>
            <rect
                stroke="none"
                :fill="`url(#${patternId})`"
                width="100%"
                height="100%"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { uuid } from '@noeldemartin/utils';

const patternId = `pattern-${uuid()}`;
</script>
