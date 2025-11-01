import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { getPosesByPalletIdUtil } from "../getPosesByPalletIdUtil.js";

describe("getPosesByPalletIdUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает позиции по palletId отсортированные по artikul", async () => {
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

    const poses = await getPosesByPalletIdUtil(pallet._id.toString());

    expect(poses.length).toBeGreaterThanOrEqual(2);
    expect(poses.every((p) => p.palletData._id.toString() === pallet._id.toString())).toBe(true);
    // Проверяем сортировку
    const artikuls = poses.map((p) => p.artikul);
    expect(artikuls).toEqual([...artikuls].sort());
  });

  it("возвращает пустой массив для несуществующего palletId", async () => {
    const { Types } = await import("mongoose");
    const nonExistentId = new Types.ObjectId().toString();
    const poses = await getPosesByPalletIdUtil(nonExistentId);
    expect(poses).toEqual([]);
  });
});

