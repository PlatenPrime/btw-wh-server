import { describe, expect, it } from "vitest";
import { calculateWarehouseDataUtil } from "../calculateWarehouseDataUtil.js";

describe("calculateWarehouseDataUtil", () => {
  it("рассчитывает суммарные quant и boxes", () => {
    const poses = [
      { quant: 10, boxes: 2 } as any,
      { quant: 5, boxes: 1 } as any,
      { quant: 15, boxes: 3 } as any,
    ];

    const result = calculateWarehouseDataUtil(poses);

    expect(result.quant).toBe(30);
    expect(result.boxes).toBe(6);
    expect(result.poses).toEqual(poses);
  });

  it("обрабатывает пустой массив", () => {
    const result = calculateWarehouseDataUtil([]);

    expect(result.quant).toBe(0);
    expect(result.boxes).toBe(0);
    expect(result.poses).toEqual([]);
  });

  it("обрабатывает нулевые значения", () => {
    const poses = [
      { quant: 0, boxes: 0 } as any,
      { quant: 10, boxes: 2 } as any,
    ];

    const result = calculateWarehouseDataUtil(poses);

    expect(result.quant).toBe(10);
    expect(result.boxes).toBe(2);
  });
});

