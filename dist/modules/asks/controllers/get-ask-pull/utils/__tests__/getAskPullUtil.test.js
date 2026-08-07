import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Art } from '../../../../../arts/models/Art.js';
import { Ask } from '../../../../models/Ask.js';
import { getAskPullUtil } from '../getAskPullUtil.js';
import * as getPosesByArtikulAndSkladUtilModule from '../getPosesByArtikulAndSkladUtil.js';
// Mock dependencies
vi.mock('../../../../models/Ask.js', () => ({
    Ask: {
        findById: vi.fn()
    }
}));
vi.mock('../../../../../arts/models/Art.js', () => ({
    Art: {
        findOne: vi.fn()
    }
}));
vi.mock('../getPosesByArtikulAndSkladUtil.js');
const mockArtFindOne = (zone) => {
    Art.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
            lean: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue(zone === null ? null : { zone })
            })
        })
    });
};
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
        Ask.findById.mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockAsk)
        });
        // Mock getPosesByArtikulAndSkladUtil
        vi.spyOn(getPosesByArtikulAndSkladUtilModule, 'getPosesByArtikulAndSkladUtil').mockResolvedValue(mockPositions);
        // Execute
        const result = await getAskPullUtil('ask-123');
        // Assert
        expect(result).not.toBeNull();
        if (result) {
            expect(result.isPullRequired).toBe(false);
            expect(result.status).toBe('satisfied');
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
        Ask.findById.mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockAsk)
        });
        vi.spyOn(getPosesByArtikulAndSkladUtilModule, 'getPosesByArtikulAndSkladUtil').mockResolvedValue(mockPositions);
        mockArtFindOne('42-1-1');
        const result = await getAskPullUtil('ask-124');
        expect(result).not.toBeNull();
        if (result) {
            expect(result.isPullRequired).toBe(true);
            expect(result.status).toBe('process');
            expect(result.remainingQuantity).toBe(0);
            expect(result.positions.length).toBeGreaterThan(0);
            expect(result.positions[0].artZone).toBe('42-1-1');
            expect(result.positions[0].quant).toBe(10);
        }
    });
    it('проставляет artZone: null когда Art не найден', async () => {
        const mockAsk = {
            _id: 'ask-125',
            status: 'new',
            artikul: 'ART-MISSING',
            sklad: 'pogrebi',
            quant: 5,
            pullQuant: 0,
            toObject: () => ({}),
        };
        const mockPositions = [
            { _id: 'pos-1', quant: 10, toObject: () => ({ _id: 'pos-1', quant: 10 }) }
        ];
        Ask.findById.mockReturnValue({
            exec: vi.fn().mockResolvedValue(mockAsk)
        });
        vi.spyOn(getPosesByArtikulAndSkladUtilModule, 'getPosesByArtikulAndSkladUtil').mockResolvedValue(mockPositions);
        mockArtFindOne(null);
        const result = await getAskPullUtil('ask-125');
        expect(result).not.toBeNull();
        if (result) {
            expect(result.isPullRequired).toBe(true);
            expect(result.positions[0].artZone).toBeNull();
            expect(result.positions[0].quant).toBe(10);
            expect(result.positions[0].plannedQuant).toBe(5);
        }
    });
});
