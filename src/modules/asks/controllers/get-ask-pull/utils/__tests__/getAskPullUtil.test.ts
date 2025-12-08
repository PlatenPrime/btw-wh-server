import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Ask } from '../../../../models/Ask.js';
import { getAskPullUtil } from '../getAskPullUtil.js';
import * as getPosesByArtikulAndSkladUtilModule from '../getPosesByArtikulAndSkladUtil.js';

// Mock dependencies
vi.mock('../../../../models/Ask.js', () => ({
    Ask: {
        findById: vi.fn()
    }
}));
vi.mock('../getPosesByArtikulAndSkladUtil.js');

describe('getAskPullUtil', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return status "excess" if no specific quantity requested (quant undefined) and already pulled some amount', async () => {
        // Setup mock data
        const mockAsk = {
            _id: 'ask-123',
            status: 'in_progress',
            artikul: 'ART-1',
            sklad: 'pogrebi',
            // No quant (undefined/null)
            pullQuant: 5, // Already pulled 5
            toObject: () => ({}),
        };

        const mockPositions = [
            { _id: 'pos-1', quant: 10, palletSector: 'A1', toObject: () => ({ _id: 'pos-1', quant: 10, palletSector: 'A1' }) }
        ];

        // Mock implementations
        (Ask.findById as any).mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockAsk)
        });

        // Mock getPosesByArtikulAndSkladUtil
        vi.spyOn(getPosesByArtikulAndSkladUtilModule, 'getPosesByArtikulAndSkladUtil').mockResolvedValue(mockPositions as any);

        // Execute
        const result = await getAskPullUtil('ask-123');

        // Assert
        expect(result).not.toBeNull();
        if (result) {
            expect(result.isPullRequired).toBe(false);
            expect(result.status).toBe('excess');
            expect(result.remainingQuantity).toBe(-5); // logic from getRemainingQuantityUtil (-pullQuant)
            expect(result.positions).toHaveLength(0);
        }
    });

    it('should return status "need_pull" if quant undefined and nothing pulled', async () => {
        const mockAsk = {
            _id: 'ask-124',
            status: 'in_progress',
            artikul: 'ART-1',
            sklad: 'pogrebi',
            pullQuant: 0,
            toObject: () => ({}),
        };

        const mockPositions = [
            { _id: 'pos-1', quant: 10, palletSector: 'A1', toObject: () => ({ _id: 'pos-1', quant: 10, palletSector: 'A1' }) }
        ];

        (Ask.findById as any).mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockAsk)
        });
        vi.spyOn(getPosesByArtikulAndSkladUtilModule, 'getPosesByArtikulAndSkladUtil').mockResolvedValue(mockPositions as any);

        const result = await getAskPullUtil('ask-124');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.isPullRequired).toBe(true);
            expect(result.status).toBe('need_pull');
            expect(result.remainingQuantity).toBeNull();
            expect(result.positions.length).toBeGreaterThan(0);
        }
    });
});
