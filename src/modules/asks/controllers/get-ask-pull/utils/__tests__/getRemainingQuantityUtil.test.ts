import { describe, expect, it } from 'vitest';
import { IAsk } from '../../../../models/Ask.js';
import { getRemainingQuantityUtil } from '../getRemainingQuantityUtil.js';

describe('getRemainingQuantityUtil', () => {
    it('should return correct positive remaining quantity', () => {
        const ask = { quant: 10, pullQuant: 4 } as IAsk;
        expect(getRemainingQuantityUtil(ask)).toBe(6);
    });

    it('should return correct zero remaining quantity', () => {
        const ask = { quant: 10, pullQuant: 10 } as IAsk;
        expect(getRemainingQuantityUtil(ask)).toBe(0);
    });

    it('should return negative remaining quantity if pulled more than requested', () => {
        const ask = { quant: 10, pullQuant: 12 } as IAsk;
        expect(getRemainingQuantityUtil(ask)).toBe(-2);
    });

    it('should return null if quant is not set and nothing pulled', () => {
        const ask = { pullQuant: 0 } as IAsk; // quant undefined
        expect(getRemainingQuantityUtil(ask)).toBe(0);
    });

    it('should return negative pullQuant if quant is not set but something pulled', () => {
        const ask = { pullQuant: 5 } as IAsk; // quant undefined
        expect(getRemainingQuantityUtil(ask)).toBe(-5);
    });

    it('should handle undefined pullQuant as 0', () => {
        const ask = { quant: 10 } as IAsk;
        expect(getRemainingQuantityUtil(ask)).toBe(10);
    });

    it('should return null if quant 0 and pullQuant 0', () => {
         const ask = { quant: 0, pullQuant: 0 } as IAsk;
         expect(getRemainingQuantityUtil(ask)).toBe(0);
    });
    
    it('should return negative pullQuant if quant 0 and pullQuant > 0', () => {
         const ask = { quant: 0, pullQuant: 5 } as IAsk;
         expect(getRemainingQuantityUtil(ask)).toBe(-5);
    });
});
