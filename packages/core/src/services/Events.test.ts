import { beforeEach, describe, expect, it } from 'vitest';

import Events, { EventListenerPriorities } from './Events';

describe('Events', () => {

    beforeEach(() => void Events.reset());

    it('registers listeners', async () => {
        // Arrange
        let counter = 0;

        Events.on('trigger', () => counter++);

        // Act
        await Events.emit('trigger');
        await Events.emit('trigger');
        await Events.emit('trigger');

        // Assert
        expect(counter).toEqual(3);
    });

    it('triggers listeners by priority', async () => {
        // Arrange
        const storage: string[] = [];

        Events.on('trigger', () => storage.push('second'));
        Events.on('trigger', { priority: EventListenerPriorities.Low }, () => storage.push('third'));
        Events.on('trigger', { priority: EventListenerPriorities.High }, () => storage.push('first'));

        // Act
        await Events.emit('trigger');

        // Assert
        expect(storage).toEqual(['first', 'second', 'third']);
    });

});
