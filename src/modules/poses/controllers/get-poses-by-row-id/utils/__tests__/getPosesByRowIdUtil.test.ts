import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { getPosesByRowIdUtil } from "../getPosesByRowIdUtil.js";

describe("getPosesByRowIdUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает позиции по rowId отсортированные по artikul", async () => {
    const row = await createTestRow();
    const pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });

    await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-Z",
    });
    await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-A",
    });

    const poses = await getPosesByRowIdUtil(row._id.toString());

    expect(poses.length).toBeGreaterThanOrEqual(2);
    expect(poses.every((p) => p.rowData._id.toString() === row._id.toString())).toBe(true);
    // Проверяем сортировку
    const artikuls = poses.map((p) => p.artikul);
    expect(artikuls).toEqual([...artikuls].sort());
  });

  it("возвращает пустой массив для несуществующего rowId", async () => {
    const { Types } = await import("mongoose");
    const nonExistentId = new Types.ObjectId().toString();
    const poses = await getPosesByRowIdUtil(nonExistentId);
    expect(poses).toEqual([]);
  });
});

