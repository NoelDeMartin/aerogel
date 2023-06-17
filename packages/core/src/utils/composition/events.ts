import { onUnmounted } from 'vue';

import Events from '@/services/Events';
import type {
    EventListener,
    EventWithPayload,
    EventWithoutPayload,
    EventsPayload,
    UnknownEvent,
} from '@/services/Events';

export function useEvent<Event extends EventWithoutPayload>(event: Event, listener: () => unknown): void;
export function useEvent<Event extends EventWithPayload>(
    event: Event,
    listener: EventListener<EventsPayload[Event]>
): void;
export function useEvent<Event extends string>(event: UnknownEvent<Event>, listener: EventListener): void;

export function useEvent(event: string, listener: EventListener): void {
    const unsubscribe = Events.on(event, listener);

    onUnmounted(() => unsubscribe());
}
