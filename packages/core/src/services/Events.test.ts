import { beforeEach, describe, expect, it } from 'vitest';

import Events, { EventListenerPriorities } from './Events';

describe('Events', () => {

    beforeEach(() => void Events.reset());

    it('registers listeners', async () => {
        // Arrange
        let counter = 0;

        Events.on('application-mounted', () => counter++);

        // Act
        await Events.emit('application-mounted');
        await Events.emit('application-mounted');
        await Events.emit('application-mounted');

        // Assert
        expect(counter).toEqual(3);
    });

    it('triggers listeners by priority', async () => {
        // Arrange
        const storage: string[] = [];

        Events.on('application-mounted', () => storage.push('second'));
        Events.on('application-mounted', { priority: EventListenerPriorities.Low }, () => storage.push('third'));
        Events.on('application-mounted', { priority: EventListenerPriorities.High }, () => storage.push('first'));

        // Act
        await Events.emit('application-mounted');

        // Assert
        expect(storage).toEqual(['first', 'second', 'third']);
    });

});
