import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { updatePosesOnMoveUtil } from "../updatePosesOnMoveUtil.js";

describe("updatePosesOnMoveUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("updates pos pallet and row data on move", async () => {
    const sourceRow = await createTestRow({ title: "Source Row" });
    const targetRow = await createTestRow({ title: "Target Row" });
    const sourcePallet = await createTestPallet({
      title: "Source-Pallet",
      row: sourceRow._id,
      rowData: { _id: sourceRow._id, title: sourceRow.title },
      sector: 10,
    });
    const targetPallet = await createTestPallet({
      title: "Target-Pallet",
      row: targetRow._id,
      rowData: { _id: targetRow._id, title: targetRow.title },
      sector: 20,
      isDef: true,
    });

    const pos = await createTestPos({
      pallet: sourcePallet._id,
      row: sourceRow._id,
      palletData: {
        _id: sourcePallet._id,
        title: sourcePallet.title,
        sector: sourcePallet.sector,
        isDef: sourcePallet.isDef,
      },
      rowData: { _id: sourceRow._id, title: sourceRow.title },
      palletTitle: sourcePallet.title,
      rowTitle: sourceRow.title,
    });

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await updatePosesOnMoveUtil({
        posesToMove: [pos],
        targetPallet,
        targetRow,
        session,
      });
    });
    await session.endSession();

    const updatedPos = await Pos.findById(pos._id).lean().exec();
    expect(updatedPos?.pallet?.toString()).toBe(targetPallet._id.toString());
    expect(updatedPos?.row?.toString()).toBe(targetRow._id.toString());
    expect(updatedPos?.palletTitle).toBe("Target-Pallet");
    expect(updatedPos?.rowTitle).toBe("Target Row");
    expect(updatedPos?.palletData).toMatchObject({
      title: "Target-Pallet",
      sector: 20,
      isDef: true,
    });
    expect(updatedPos?.rowData).toMatchObject({
      title: "Target Row",
    });
  });
});
