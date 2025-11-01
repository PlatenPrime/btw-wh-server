import { describe, expect, it } from "vitest";
import { groupPosesByWarehouseUtil } from "../groupPosesByWarehouseUtil.js";

describe("groupPosesByWarehouseUtil", () => {
  it("группирует позиции по складам", () => {
    const poses = [
      { sklad: "pogrebi" } as any,
      { sklad: "pogrebi" } as any,
      { sklad: "merezhi" } as any,
      { sklad: "merezhi" } as any,
      { sklad: "other" } as any,
      { sklad: undefined } as any,
    ];

    const result = groupPosesByWarehouseUtil(poses);

    expect(result.pogrebi.length).toBe(2);
    expect(result.merezhi.length).toBe(2);
    expect(result.other.length).toBe(2);
  });

  it("обрабатывает регистр склада", () => {
    const poses = [
      { sklad: "POGRebi" } as any,
      { sklad: "MeReZhI" } as any,
    ];

    const result = groupPosesByWarehouseUtil(poses);

    expect(result.pogrebi.length).toBe(1);
    expect(result.merezhi.length).toBe(1);
  });

  it("возвращает пустые массивы для пустого входного массива", () => {
    const result = groupPosesByWarehouseUtil([]);

    expect(result.pogrebi).toEqual([]);
    expect(result.merezhi).toEqual([]);
    expect(result.other).toEqual([]);
  });
});

