<template>
    <Modal :title="$td('cloud.logIn.title', 'Connect account')">
        <Markdown
            lang-key="cloud.logIn.info"
            lang-default="Log in to your [Solid account](https://solidproject.org) to keep data safe across devices."
        />
        <Link
            class="mt-2 text-sm opacity-50 hover:opacity-75 focus-visible:opacity-75"
            @click="
                $ui.alert(
                    $td('cloud.logIn.learnMore', 'What is Solid?'),
                    $td(
                        'cloud.logIn.learnMoreMessage',
                        'Solid is a decentralized storage protocol built on top of web standards. ' +
                            'If you want to use this app across devices, ' +
                            'you can use Solid to keep changes in sync. ' +
                            'Even if you use it in a single device, ' +
                            'this will also keep your data secure in case your device is lost.\n\n' +
                            'In any case, Focus works 100% offline and you can connect your Solid POD later on. ' +
                            'If you\'ve never heard of Solid and you\'re just trying things out, ' +
                            'you can keep using it without an account.\n\n' +
                            '[Learn more](https://solidproject.org)'
                    )
                )
            "
        >
            {{ $td('cloud.logIn.learnMore', 'What is Solid?') }}
        </Link>
        <SolidLogin no-loading class="mt-4" />
    </Modal>
</template>

<script setup lang="ts">
import { Link, Markdown, Modal } from '@aerogel/core';
import { SolidLogin } from '@aerogel/plugin-solid';
</script>
