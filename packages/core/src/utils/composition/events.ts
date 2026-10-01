import Events from '@aerogel/core/services/Events';
import type {
    EventListener,
    EventWithPayload,
    EventWithoutPayload,
    EventsPayload,
} from '@aerogel/core/services/Events';
import { onUnmounted } from 'vue';

export function useEvent<Event extends EventWithoutPayload>(event: Event, listener: () => unknown): void;
export function useEvent<Event extends EventWithPayload>(
    event: Event,
    listener: EventListener<EventsPayload[Event]>,
): void;

export function useEvent(event: string, listener: EventListener): void {
    // oxlint-disable-next-line typescript/no-explicit-any
    const unsubscribe = Events.on(event as any, listener);

    onUnmounted(() => unsubscribe());
}
