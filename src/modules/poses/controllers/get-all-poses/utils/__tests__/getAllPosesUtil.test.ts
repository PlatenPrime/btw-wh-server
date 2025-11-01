import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { getAllPosesUtil } from "../getAllPosesUtil.js";

describe("getAllPosesUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает позиции с пагинацией", async () => {
    const row = await createTestRow();
    const pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });

    // Создаём несколько позиций
    await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-1",
    });
    await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-2",
    });

    const result = await getAllPosesUtil({
      filter: {},
      page: 1,
      limit: 10,
    });

    expect(result.data.length).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("фильтрует позиции по artikul", async () => {
    const row = await createTestRow();
    const pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });

    await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-FILTER",
    });
    await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-OTHER",
    });

    const result = await getAllPosesUtil({
      filter: { artikul: "FILTER" },
      page: 1,
      limit: 10,
    });

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data.every((p) => p.artikul.includes("FILTER"))).toBe(true);
  });

  it("фильтрует позиции по palletId", async () => {
    const row = await createTestRow();
    const pallet1 = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });
    const pallet2 = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });

    await createTestPos({
      pallet: { _id: pallet1._id, title: pallet1.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-1",
    });
    await createTestPos({
      pallet: { _id: pallet2._id, title: pallet2.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-2",
    });

    const result = await getAllPosesUtil({
      filter: { palletId: pallet1._id.toString() },
      page: 1,
      limit: 10,
    });

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(
      result.data.every(
        (p) => p.palletData._id.toString() === pallet1._id.toString()
      )
    ).toBe(true);
  });
});

