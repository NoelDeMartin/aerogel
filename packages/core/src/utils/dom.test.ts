import { describe, expect, it, vi } from 'vite-plus/test';

import { copyToClipboard } from './dom';

describe('copyToClipboard', () => {
    it('uses navigator.clipboard.writeText when available', async () => {
        // Arrange
        const writeText = vi.fn().mockResolvedValue(undefined);

        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });

        // Act
        const copied = await copyToClipboard('debug info');

        // Assert
        expect(copied).toBe(true);
        expect(writeText).toHaveBeenCalledWith('debug info');
    });

    it('falls back to document.execCommand when navigator.clipboard is undefined', async () => {
        // Arrange
        const execCommand = vi.fn().mockReturnValue(true);

        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true,
        });
        Object.defineProperty(document, 'execCommand', {
            value: execCommand,
            configurable: true,
        });

        // Act
        const copied = await copyToClipboard('debug info');

        // Assert
        expect(copied).toBe(true);
        expect(execCommand).toHaveBeenCalledWith('copy');
        expect(document.body.querySelector('textarea')).toBeNull();
    });
});
