import { describe, expect, it } from "vitest";
import { createTestPos } from "../../../../../../test/setup.js";
import { getPosesByArtikulAndSkladUtil } from "../getPosesByArtikulAndSkladUtil.js";

describe("getPosesByArtikulAndSkladUtil", () => {
  it("получает позиции по артикулу и складу", async () => {
    const artikul = "ART-TEST";
    const sklad = "pogrebi";

    await createTestPos({
      artikul,
      sklad,
      quant: 10,
    });

    await createTestPos({
      artikul,
      sklad,
      quant: 5,
    });

    const result = await getPosesByArtikulAndSkladUtil(artikul, sklad);

    expect(result.length).toBe(2);
    expect(result.every((pos) => pos.artikul === artikul)).toBe(true);
    expect(result.every((pos) => pos.sklad === sklad)).toBe(true);
  });

  it("фильтрует позиции с quant > 0", async () => {
    const artikul = "ART-FILTER";
    const sklad = "pogrebi";

    await createTestPos({
      artikul,
      sklad,
      quant: 10,
    });

    await createTestPos({
      artikul,
      sklad,
      quant: 0, // Не должна быть включена
    });

    await createTestPos({
      artikul,
      sklad,
      quant: -5, // Не должна быть включена
    });

    const result = await getPosesByArtikulAndSkladUtil(artikul, sklad);

    expect(result.length).toBe(1);
    expect(result[0].quant).toBe(10);
  });

  it("использует значение по умолчанию для склада (pogrebi)", async () => {
    const artikul = "ART-DEFAULT";

    await createTestPos({
      artikul,
      sklad: "pogrebi",
      quant: 10,
    });

    await createTestPos({
      artikul,
      sklad: "merezhi",
      quant: 5,
    });

    // Вызываем без указания склада
    const result = await getPosesByArtikulAndSkladUtil(artikul);

    expect(result.length).toBe(1);
    expect(result[0].sklad).toBe("pogrebi");
    expect(result[0].quant).toBe(10);
  });

  it("обрабатывает несуществующий артикул", async () => {
    const result = await getPosesByArtikulAndSkladUtil(
      "ART-NONEXISTENT",
      "pogrebi"
    );

    expect(result).toEqual([]);
  });

  it("фильтрует по складу", async () => {
    const artikul = "ART-SKLAD";

    await createTestPos({
      artikul,
      sklad: "pogrebi",
      quant: 10,
    });

    await createTestPos({
      artikul,
      sklad: "merezhi",
      quant: 5,
    });

    const resultPogrebi = await getPosesByArtikulAndSkladUtil(artikul, "pogrebi");
    const resultMerezhi = await getPosesByArtikulAndSkladUtil(artikul, "merezhi");

    expect(resultPogrebi.length).toBe(1);
    expect(resultPogrebi[0].sklad).toBe("pogrebi");

    expect(resultMerezhi.length).toBe(1);
    expect(resultMerezhi[0].sklad).toBe("merezhi");
  });

  it("возвращает пустой массив когда все позиции имеют quant <= 0", async () => {
    const artikul = "ART-ZERO";
    const sklad = "pogrebi";

    await createTestPos({
      artikul,
      sklad,
      quant: 0,
    });

    await createTestPos({
      artikul,
      sklad,
      quant: -1,
    });

    const result = await getPosesByArtikulAndSkladUtil(artikul, sklad);

    expect(result).toEqual([]);
  });
});

