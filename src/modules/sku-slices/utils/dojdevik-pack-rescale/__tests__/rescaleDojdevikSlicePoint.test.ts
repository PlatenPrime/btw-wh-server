import { describe, expect, it } from "vitest";
import { rescaleDojdevikSlicePoint } from "../rescaleDojdevikSlicePoint.js";

describe("rescaleDojdevikSlicePoint", () => {
  it("rescales fountain case 100→6", () => {
    expect(rescaleDojdevikSlicePoint({ stock: 6300, price: 0.58 }, 100, 6)).toEqual({
      stock: 378,
      price: 9.67,
    });
  });

  it("is no-op when packs equal", () => {
    expect(rescaleDojdevikSlicePoint({ stock: 100, price: 1.5 }, 100, 100)).toEqual({
      stock: 100,
      price: 1.5,
    });
  });

  it("does not touch sentinel -1", () => {
    expect(rescaleDojdevikSlicePoint({ stock: -1, price: -1 }, 100, 6)).toEqual({
      stock: -1,
      price: -1,
    });
    expect(rescaleDojdevikSlicePoint({ stock: 10, price: -1 }, 100, 6)).toEqual({
      stock: 10,
      price: -1,
    });
  });

  it("is no-op for invalid packs", () => {
    expect(rescaleDojdevikSlicePoint({ stock: 100, price: 1 }, 0, 6)).toEqual({
      stock: 100,
      price: 1,
    });
  });

  it("scales 1→6 (under-counted history)", () => {
    expect(rescaleDojdevikSlicePoint({ stock: 10, price: 12 }, 1, 6)).toEqual({
      stock: 60,
      price: 2,
    });
  });
});
