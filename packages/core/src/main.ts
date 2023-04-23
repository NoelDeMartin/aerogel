import { Component, createApp } from 'vue';

export function bootstrapApplication(rootComponent: Component): void {
    const app = createApp(rootComponent);

    app.mount('#app');
}
