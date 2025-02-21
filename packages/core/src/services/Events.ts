import { arrayRemove, facade, fail, tap } from '@noeldemartin/utils';

import Service from '@/services/Service';

export interface EventsPayload {}
export interface EventListenerOptions {
    priority: EventListenerPriority;
}
export type AerogelGlobalEvents = Partial<{ [Event in EventWithoutPayload]: () => unknown }> &
    Partial<{ [Event in EventWithPayload]: EventListener<EventsPayload[Event]> }>;

export type EventListener<T = unknown> = (payload: T) => unknown;
export type UnknownEvent<T> = T extends keyof EventsPayload ? never : T;

export type EventWithoutPayload = {
    [K in keyof EventsPayload]: EventsPayload[K] extends void ? K : never;
}[keyof EventsPayload];

export type EventWithPayload = {
    [K in keyof EventsPayload]: EventsPayload[K] extends void ? never : K;
}[keyof EventsPayload];

export const EventListenerPriorities = {
    Low: -256,
    Default: 0,
    High: 256,
} as const;

export type EventListenerPriority = (typeof EventListenerPriorities)[keyof typeof EventListenerPriorities];

export class EventsService extends Service {

    private listeners: Record<string, { priorities: number[]; handlers: Record<number, EventListener[]> }> = {};

    protected async boot(): Promise<void> {
        Object.entries(globalThis.__aerogelEvents__ ?? {}).forEach(([event, listener]) =>
            this.on(event as string, listener as EventListener));
    }

    public emit<Event extends EventWithoutPayload>(event: Event): Promise<void>;
    public emit<Event extends EventWithPayload>(event: Event, payload: EventsPayload[Event]): Promise<void>;
    public emit<Event extends string>(event: UnknownEvent<Event>, payload?: unknown): Promise<void>;
    public async emit(event: string, payload?: unknown): Promise<void> {
        const listeners = this.listeners[event] ?? { priorities: [], handlers: {} };

        for (const priority of listeners.priorities) {
            await Promise.all(listeners.handlers[priority]?.map((listener) => listener(payload)) ?? []);
        }
    }

    /* eslint-disable max-len */
    public on<Event extends EventWithoutPayload>(event: Event, listener: () => unknown): () => void;
    public on<Event extends EventWithoutPayload>(event: Event, priority: EventListenerPriority, listener: () => unknown): () => void; // prettier-ignore
    public on<Event extends EventWithoutPayload>(event: Event, options: Partial<EventListenerOptions>, listener: () => unknown): () => void; // prettier-ignore
    public on<Event extends EventWithPayload>(event: Event, listener: EventListener<EventsPayload[Event]>): () => void | void; // prettier-ignore
    public on<Event extends EventWithPayload>(event: Event, priority: EventListenerPriority, listener: EventListener<EventsPayload[Event]>): () => void | void; // prettier-ignore
    public on<Event extends EventWithPayload>(event: Event, options: Partial<EventListenerOptions>, listener: EventListener<EventsPayload[Event]>): () => void | void; // prettier-ignore
    public on<Event extends string>(event: UnknownEvent<Event>, listener: EventListener): () => void;
    public on<Event extends string>(event: UnknownEvent<Event>, priority: EventListenerPriority, listener: EventListener): () => void; // prettier-ignore
    public on<Event extends string>(event: UnknownEvent<Event>, options: Partial<EventListenerOptions>, listener: EventListener): () => void; // prettier-ignore
    /* eslint-enable max-len */

    public on(
        event: string,
        optionsOrListener: Partial<EventListenerOptions> | EventListenerPriority | EventListener,
        listener?: EventListener,
    ): () => void {
        const options =
            typeof optionsOrListener === 'function'
                ? {}
                : typeof optionsOrListener === 'number'
                    ? { priority: optionsOrListener }
                    : optionsOrListener;
        const handler = typeof optionsOrListener === 'function' ? optionsOrListener : (listener as EventListener);

        this.registerListener(event, options, handler);

        return () => this.off(event, handler);
    }

    /* eslint-disable max-len */
    public once<Event extends EventWithoutPayload>(event: Event, listener: () => unknown): () => void;
    public once<Event extends EventWithoutPayload>(event: Event, options: Partial<EventListenerOptions>, listener: () => unknown): () => void; // prettier-ignore
    public once<Event extends EventWithPayload>(event: Event, listener: EventListener<EventsPayload[Event]>): () => void | void; // prettier-ignore
    public once<Event extends EventWithPayload>(event: Event, options: Partial<EventListenerOptions>, listener: EventListener<EventsPayload[Event]>): () => void | void; // prettier-ignore
    public once<Event extends string>(event: UnknownEvent<Event>, listener: EventListener): () => void;
    public once<Event extends string>(event: UnknownEvent<Event>, options: Partial<EventListenerOptions>, listener: EventListener): () => void; // prettier-ignore
    /* eslint-enable max-len */

    public once(
        event: string,
        optionsOrListener: Partial<EventListenerOptions> | EventListener,
        listener?: EventListener,
    ): () => void {
        let onceListener: EventListener | null = null;
        const options = typeof optionsOrListener === 'function' ? {} : optionsOrListener;
        const handler = typeof optionsOrListener === 'function' ? optionsOrListener : (listener as EventListener);

        return tap(
            () => onceListener && this.off(event, onceListener),
            (off) => {
                onceListener = (...args) => {
                    off();

                    return handler(...args);
                };

                this.registerListener(event, options, handler);
            },
        );
    }

    public off(event: string, listener: EventListener): void {
        const listeners = this.listeners[event];

        if (!listeners) {
            return;
        }

        const priorities = [...listeners.priorities];

        for (const priority of priorities) {
            arrayRemove(listeners.handlers[priority] ?? [], listener);

            if (listeners.handlers[priority]?.length === 0) {
                delete listeners.handlers[priority];
                arrayRemove(listeners.priorities, priority);
            }
        }

        if (listeners.priorities.length === 0) {
            delete this.listeners[event];
        }
    }

    protected registerListener(event: string, options: Partial<EventListenerOptions>, handler: EventListener): void {
        const priority = options.priority ?? 0;

        if (!(event in this.listeners)) {
            this.listeners[event] = { priorities: [], handlers: {} };
        }

        const priorities =
            this.listeners[event]?.priorities ?? fail<number[]>(`priorities missing for event '${event}'`);
        const handlers =
            this.listeners[event]?.handlers ??
            fail<Record<number, EventListener[]>>(`handlers missing for event '${event}'`);

        if (!priorities.includes(priority)) {
            priorities.push(priority);
            priorities.sort((a, b) => b - a);
            handlers[priority] = [];
        }

        handlers[priority]?.push(handler);
    }

}

export default facade(EventsService);

declare global {
    // eslint-disable-next-line no-var
    var __aerogelEvents__: AerogelGlobalEvents | undefined;
}
