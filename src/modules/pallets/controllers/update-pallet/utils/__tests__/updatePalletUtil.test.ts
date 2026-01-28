import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { Pallet } from "../../../../models/Pallet.js";
import { updatePalletUtil } from "../updatePalletUtil.js";

describe("updatePalletUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("обновляет паллету с новым title и sector", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const pallet = await createTestPallet({
        title: "Old-Pallet",
        sector: 1,
      });

      const result = await updatePalletUtil({
        palletId: String(pallet._id),
        title: "New-Pallet",
        sector: 2,
        session,
      });

      expect(result.title).toBe("New-Pallet");
      expect(result.sector).toBe(2);

      const found = await Pallet.findById(pallet._id).session(session);
      expect(found?.title).toBe("New-Pallet");
      expect(found?.sector).toBe(2);
    });
    await session.endSession();
  });

  it("обновляет row и rowData", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row1 = await createTestRow({ title: "Row 1" });
      const row2 = await createTestRow({ title: "Row 2" });
      const pallet = await createTestPallet({
        row: row1._id,
        rowData: { _id: row1._id, title: row1.title },
      });

      const result = await updatePalletUtil({
        palletId: String(pallet._id),
        rowId: String(row2._id),
        rowDoc: row2,
        session,
      });

      expect(result.row.toString()).toBe(String(row2._id));
      expect(result.rowData._id.toString()).toBe(String(row2._id));
      expect(result.rowData.title).toBe("Row 2");
    });
    await session.endSession();
  });

  it("выбрасывает ошибку если паллета не найдена", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await expect(
        updatePalletUtil({
          palletId: new mongoose.Types.ObjectId().toString(),
          session,
        }),
      ).rejects.toThrow("Pallet not found");
    });
    await session.endSession();
  });
});
