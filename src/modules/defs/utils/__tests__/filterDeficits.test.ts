import { describe, expect, it } from "vitest";
import { ISharikStocksResult } from "../../../poses/utils/getSharikStocks.js";
import { filterDeficits } from "../filterDeficits.js";

describe("filterDeficits", () => {
  it("должна включать артикулы с difQuant <= 0", () => {
    const mockData: ISharikStocksResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 5,
        difQuant: -5, // Дефицит
        limit: 20,
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 10,
        boxes: 2,
        sharikQuant: 10,
        difQuant: 0, // Граничный случай
        limit: 20,
      },
    };

    const result = filterDeficits(mockData);

    expect(result).toHaveProperty("ART001");
    expect(result).toHaveProperty("ART002");
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("должна включать артикулы с quant <= limit", () => {
    const mockData: ISharikStocksResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
        sharikQuant: 10,
        difQuant: 5, // Нет дефицита
        limit: 5, // quant <= limit
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 3,
        boxes: 1,
        sharikQuant: 10,
        difQuant: 7, // Нет дефицита
        limit: 5, // quant < limit
      },
    };

    const result = filterDeficits(mockData);

    expect(result).toHaveProperty("ART001");
    expect(result).toHaveProperty("ART002");
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("должна исключать артикулы с difQuant > 0 и quant > limit", () => {
    const mockData: ISharikStocksResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 15,
        boxes: 3,
        sharikQuant: 20,
        difQuant: 5, // Нет дефицита
        limit: 10, // quant > limit
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 20,
        boxes: 4,
        sharikQuant: 25,
        difQuant: 5, // Нет дефицита
        limit: undefined, // limit не определен
      },
    };

    const result = filterDeficits(mockData);

    expect(result).not.toHaveProperty("ART001");
    expect(result).not.toHaveProperty("ART002");
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("должна обрабатывать смешанные случаи", () => {
    const mockData: ISharikStocksResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 5,
        difQuant: -5, // Дефицит - должен быть включен
        limit: 20,
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 5,
        boxes: 1,
        sharikQuant: 10,
        difQuant: 5, // Нет дефицита, но quant <= limit - должен быть включен
        limit: 5,
      },
      ART003: {
        nameukr: "Товар 3",
        quant: 15,
        boxes: 3,
        sharikQuant: 20,
        difQuant: 5, // Нет дефицита и quant > limit - должен быть исключен
        limit: 10,
      },
      ART004: {
        nameukr: "Товар 4",
        quant: 20,
        boxes: 4,
        sharikQuant: 25,
        difQuant: 5, // Нет дефицита и limit не определен - должен быть исключен
        limit: undefined,
      },
    };

    const result = filterDeficits(mockData);

    expect(result).toHaveProperty("ART001");
    expect(result).toHaveProperty("ART002");
    expect(result).not.toHaveProperty("ART003");
    expect(result).not.toHaveProperty("ART004");
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("должна обрабатывать пустой объект", () => {
    const result = filterDeficits({});

    expect(result).toEqual({});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("должна обрабатывать артикулы с limit = 0", () => {
    const mockData: ISharikStocksResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 0,
        boxes: 0,
        sharikQuant: 10,
        difQuant: 10, // Нет дефицита
        limit: 0, // quant <= limit (оба равны 0)
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 1,
        boxes: 1,
        sharikQuant: 10,
        difQuant: 9, // Нет дефицита
        limit: 0, // quant > limit
      },
    };

    const result = filterDeficits(mockData);

    expect(result).toHaveProperty("ART001");
    expect(result).not.toHaveProperty("ART002");
    expect(Object.keys(result)).toHaveLength(1);
  });
});
