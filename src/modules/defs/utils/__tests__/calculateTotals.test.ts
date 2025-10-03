import { describe, expect, it } from "vitest";
import { IDeficitCalculationResult } from "../../models/Def.js";
import { calculateDeficitTotals } from "../calculateTotals.js";

describe("calculateDeficitTotals", () => {
  it("должна правильно считать общее количество дефицитов", () => {
    const mockData: IDeficitCalculationResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        sharikQuant: 5, // критический дефицит
        difQuant: -5,
        defLimit: 30, // 10 + 20
        status: "critical",
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 10,
        sharikQuant: 25, // лимитированный дефицит
        difQuant: 15,
        defLimit: 30, // 10 + 20
        status: "limited",
      },
      ART003: {
        nameukr: "Товар 3",
        quant: 15,
        sharikQuant: 20, // лимитированный дефицит
        difQuant: 5,
        defLimit: 25, // 15 + 10
        status: "limited",
      },
    };

    const result = calculateDeficitTotals(mockData);

    expect(result.total).toBe(3);
  });

  it("должна правильно считать критические дефициты (sharikQuant <= quant)", () => {
    const mockData: IDeficitCalculationResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        sharikQuant: 5, // критический дефицит (sharikQuant <= quant)
        difQuant: -5,
        defLimit: 30,
        status: "critical",
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 10,
        sharikQuant: 10, // граничный случай критического дефицита (sharikQuant = quant)
        difQuant: 0,
        defLimit: 30,
        status: "critical",
      },
      ART003: {
        nameukr: "Товар 3",
        quant: 10,
        sharikQuant: 15, // не критический дефицит (sharikQuant > quant)
        difQuant: 5,
        defLimit: 30,
        status: "limited",
      },
    };

    const result = calculateDeficitTotals(mockData);

    expect(result.totalCriticalDefs).toBe(2); // ART001 и ART002
  });

  it("должна правильно считать лимитированные дефициты (sharikQuant <= defLimit и sharikQuant > quant)", () => {
    const mockData: IDeficitCalculationResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        sharikQuant: 25, // лимитированный дефицит (sharikQuant <= defLimit и > quant)
        difQuant: 15,
        defLimit: 30, // 10 + 20
        status: "limited",
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 10,
        sharikQuant: 30, // граничный случай лимитированного дефицита (sharikQuant = defLimit)
        difQuant: 20,
        defLimit: 30,
        status: "limited",
      },
      ART003: {
        nameukr: "Товар 3",
        quant: 10,
        sharikQuant: 35, // не лимитированный дефицит (sharikQuant > defLimit)
        difQuant: 25,
        defLimit: 30,
        status: "limited", // В реальности этот элемент не должен попадать в дефициты
      },
    };

    const result = calculateDeficitTotals(mockData);

    expect(result.totalLimitDefs).toBe(3); // ART001, ART002 и ART003 (все имеют status: 'limited')
  });

  it("должна обрабатывать смешанные случаи", () => {
    const mockData: IDeficitCalculationResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        sharikQuant: 5, // критический дефицит
        difQuant: -5,
        defLimit: 30,
        status: "critical",
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 10,
        sharikQuant: 25, // лимитированный дефицит
        difQuant: 15,
        defLimit: 30,
        status: "limited",
      },
      ART003: {
        nameukr: "Товар 3",
        quant: 15,
        sharikQuant: 35, // не дефицит (sharikQuant > defLimit)
        difQuant: 20,
        defLimit: 25,
        status: "limited",
      },
    };

    const result = calculateDeficitTotals(mockData);

    expect(result.total).toBe(3);
    expect(result.totalCriticalDefs).toBe(1); // ART001
    expect(result.totalLimitDefs).toBe(2); // ART002 и ART003 (оба имеют status: 'limited')
  });

  it("должна обрабатывать пустой объект", () => {
    const result = calculateDeficitTotals({});

    expect(result.total).toBe(0);
    expect(result.totalCriticalDefs).toBe(0);
    expect(result.totalLimitDefs).toBe(0);
  });

  it("должна правильно обрабатывать граничные случаи", () => {
    const mockData: IDeficitCalculationResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        sharikQuant: 10, // sharikQuant = quant (граничный критический дефицит)
        difQuant: 0,
        defLimit: 30,
        status: "critical",
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 10,
        sharikQuant: 30, // sharikQuant = defLimit (граничный лимитированный дефицит)
        difQuant: 20,
        defLimit: 30,
        status: "limited",
      },
      ART003: {
        nameukr: "Товар 3",
        quant: 10,
        sharikQuant: 31, // sharikQuant > defLimit (граничный случай без дефицита)
        difQuant: 21,
        defLimit: 30,
        status: "limited",
      },
    };

    const result = calculateDeficitTotals(mockData);

    expect(result.total).toBe(3);
    expect(result.totalCriticalDefs).toBe(1); // ART001
    expect(result.totalLimitDefs).toBe(2); // ART002 и ART003 (оба имеют status: 'limited')
  });
});
