import { afterEach, describe, expect, it, vi } from "vitest";
import { jitterMs } from "../jitterMs.js";

describe("jitterMs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("при random=0 возвращает нижнюю границу", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(jitterMs(500, 1500)).toBe(500);
  });

  it("при random чуть меньше 1 возвращает верхнюю границу", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(jitterMs(500, 1500)).toBe(1500);
  });

  it("при min === max возвращает это значение", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.42);
    expect(jitterMs(1000, 1000)).toBe(1000);
  });

  it("нормализует перепутанные min и max", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValue(0);
    expect(jitterMs(1500, 500)).toBe(500);
    spy.mockReturnValue(0.999999);
    expect(jitterMs(1500, 500)).toBe(1500);
  });
});
