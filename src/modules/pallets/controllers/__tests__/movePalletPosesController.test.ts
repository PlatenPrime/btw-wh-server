import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestRow, createTestPallet, createTestPos } from "../../../../test/utils/testHelpers.js";
import { movePalletPosesController } from "../move-pallet-poses/movePalletPosesController.js";

describe("movePalletPosesController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("200: перемещает poses из source в target паллету", async () => {
    const row1 = await createTestRow({ title: "Row 1" });
    const row2 = await createTestRow({ title: "Row 2" });
    const sourcePallet = await createTestPallet({
      title: "Source-Pallet",
      row: row1._id,
      rowData: { _id: row1._id, title: row1.title },
      poses: [],
    });
    const targetPallet = await createTestPallet({
      title: "Target-Pallet",
      row: row2._id,
      rowData: { _id: row2._id, title: row2.title },
      poses: [],
    });
    const pos = await createTestPos({
      pallet: sourcePallet._id,
      palletData: {
        _id: sourcePallet._id,
        title: sourcePallet.title,
        sector: sourcePallet.sector,
        isDef: sourcePallet.isDef,
      },
      palletTitle: sourcePallet.title,
      row: row1._id,
      rowData: { _id: row1._id, title: row1.title },
      rowTitle: row1.title,
    });

    // Обновляем poses в source паллете через findByIdAndUpdate для гарантии сохранения
    const PalletModel = mongoose.model("Pallet");
    const updatedSource = await PalletModel.findByIdAndUpdate(
      sourcePallet._id,
      { $set: { poses: [pos._id] } },
      { new: true }
    );
    expect(updatedSource?.poses.length).toBe(1);

    // Убеждаемся что target пустая
    const checkedTarget = await PalletModel.findById(targetPallet._id);
    expect(checkedTarget?.poses.length).toBe(0);

    const req = {
      body: {
        sourcePalletId: String(sourcePallet._id),
        targetPalletId: String(targetPallet._id),
      },
    } as unknown as Request;

    await movePalletPosesController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Poses moved successfully");
    expect(responseJson.targetPallet).toBeDefined();
  });

  it("400: если source и target ID одинаковые", async () => {
    const pallet = await createTestPallet();

    const req = {
      body: {
        sourcePalletId: String(pallet._id),
        targetPalletId: String(pallet._id),
      },
    } as unknown as Request;

    await movePalletPosesController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe(
      "Source and target pallet IDs must be different"
    );
  });

  it("404: если source pallet не найдена", async () => {
    const targetPallet = await createTestPallet({ poses: [] });

    const req = {
      body: {
        sourcePalletId: new mongoose.Types.ObjectId().toString(),
        targetPalletId: String(targetPallet._id),
      },
    } as unknown as Request;

    await movePalletPosesController(req, res);

    expect(responseStatus.code).toBe(404);
  });
});

