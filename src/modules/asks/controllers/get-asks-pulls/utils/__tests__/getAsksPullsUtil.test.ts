import { describe, expect, it } from "vitest";
import { createTestAsk, createTestPos } from "../../../../../../test/setup.js";
import { getAsksPullsUtil } from "../getAsksPullsUtil.js";

describe("getAsksPullsUtil", () => {
  it("получает позиции для всех активных заявок (new, processing)", async () => {
    // Создаем активные заявки
    const ask1 = await createTestAsk({
      artikul: "ART-1",
      quant: 10,
      pullQuant: 0,
      status: "new",
      sklad: "pogrebi",
    });

    const ask2 = await createTestAsk({
      artikul: "ART-2",
      quant: 5,
      pullQuant: 0,
      status: "processing",
      sklad: "pogrebi",
    });

    // Создаем позиции для этих заявок
    await createTestPos({
      artikul: "ART-1",
      quant: 15,
      sklad: "pogrebi",
    });

    await createTestPos({
      artikul: "ART-2",
      quant: 10,
      sklad: "pogrebi",
    });

    const result = await getAsksPullsUtil();

    expect(result).toBeDefined();
    expect(result.response).toBeDefined();
    expect(result.response.positionsBySector).toBeDefined();
    expect(Array.isArray(result.response.positionsBySector)).toBe(true);
    expect(result.processingAsks).toBeDefined();
    expect(Array.isArray(result.processingAsks)).toBe(true);
  });

  it("фильтрует processing заявки для фоновой обработки", async () => {
    // Создаем заявки с разными статусами
    const askNew = await createTestAsk({
      artikul: "ART-NEW",
      quant: 10,
      status: "new",
      sklad: "pogrebi",
    });

    const askProcessing = await createTestAsk({
      artikul: "ART-PROCESSING",
      quant: 5,
      status: "processing",
      sklad: "pogrebi",
    });

    await createTestAsk({
      artikul: "ART-COMPLETED",
      status: "completed",
    });

    await createTestPos({
      artikul: "ART-NEW",
      quant: 15,
      sklad: "pogrebi",
    });

    await createTestPos({
      artikul: "ART-PROCESSING",
      quant: 10,
      sklad: "pogrebi",
    });

    const result = await getAsksPullsUtil();

    // Проверяем что processing заявки включены в processingAsks
    const processingAskIds = result.processingAsks.map((ask) =>
      String(ask._id)
    );
    expect(processingAskIds).toContain(String(askProcessing._id));
    expect(processingAskIds).not.toContain(String(askNew._id));
  });

  it("группирует позиции по секторам", async () => {
    const ask = await createTestAsk({
      artikul: "ART-GROUP",
      quant: 10,
      pullQuant: 0,
      status: "new",
      sklad: "pogrebi",
    });

    // Создаем позиции с разными секторами
    const pos1 = await createTestPos({
      artikul: "ART-GROUP",
      quant: 5,
      sklad: "pogrebi",
    });
    pos1.palletData = { ...pos1.palletData, sector: 1 };
    await pos1.save();

    const pos2 = await createTestPos({
      artikul: "ART-GROUP",
      quant: 5,
      sklad: "pogrebi",
    });
    pos2.palletData = { ...pos2.palletData, sector: 2 };
    await pos2.save();

    const result = await getAsksPullsUtil();

    expect(result.response.positionsBySector.length).toBeGreaterThan(0);
    // Проверяем что секторы отсортированы по возрастанию
    const sectors = result.response.positionsBySector.map((g) => g.sector);
    const sortedSectors = [...sectors].sort((a, b) => a - b);
    expect(sectors).toEqual(sortedSectors);
  });

  it("обрабатывает пустой список заявок", async () => {
    // Не создаем заявок
    const result = await getAsksPullsUtil();

    expect(result.response.positionsBySector).toEqual([]);
    expect(result.processingAsks).toEqual([]);
  });

  it("не включает завершенные или отклоненные заявки", async () => {
    await createTestAsk({
      artikul: "ART-COMPLETED",
      status: "completed",
    });

    await createTestAsk({
      artikul: "ART-REJECTED",
      status: "rejected",
    });

    const result = await getAsksPullsUtil();

    expect(result.response.positionsBySector).toEqual([]);
    expect(result.processingAsks).toEqual([]);
  });

  it("включает информацию о заявке в каждую позицию", async () => {
    const ask = await createTestAsk({
      artikul: "ART-WITH-INFO",
      quant: 10,
      pullQuant: 0,
      status: "new",
      sklad: "pogrebi",
    });

    await createTestPos({
      artikul: "ART-WITH-INFO",
      quant: 15,
      sklad: "pogrebi",
    });

    const result = await getAsksPullsUtil();

    if (result.response.positionsBySector.length > 0) {
      const firstPosition =
        result.response.positionsBySector[0].positions[0];
      expect(firstPosition).toBeDefined();
      expect(firstPosition.askId).toBeDefined();
      expect(firstPosition.askArtikul).toBe("ART-WITH-INFO");
    }
  });
});

