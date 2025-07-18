import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Row } from "../../models/Row.js";
import { getAllRows } from "../getAllRows.js";

// Вспомогательная функция для создания тестового ряда
const createTestRow = async (rowData: any = {}) => {
  return await Row.create({
    title: rowData.title || `Test Row ${Date.now()}`,
    pallets: rowData.pallets || [],
  });
};

describe("getAllRows Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: any;
  let responseStatus: any;
  let res: Response;

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
    vi.clearAllMocks();
  });

  it("should return all rows sorted by title", async () => {
    // Arrange
    await createTestRow({ title: "B Row" });
    await createTestRow({ title: "A Row" });
    mockRequest = {};

    // Act
    await getAllRows(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson)).toBe(true);
    expect(responseJson.length).toBe(2);
    expect(responseJson[0].title).toBe("A Row");
    expect(responseJson[1].title).toBe("B Row");
  });

  it("should return 404 if no rows found", async () => {
    // Arrange
    mockRequest = {};

    // Act
    await getAllRows(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Rows not found");
  });

  it("should handle server error", async () => {
    // Arrange
    vi.spyOn(Row, "find").mockRejectedValueOnce(new Error("DB error"));
    mockRequest = {};

    // Act
    await getAllRows(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });

  it("should return rows with correct pallet references", async () => {
    // Arrange
    const row = await createTestRow({ title: "RowWithPallets" });
    const pallet = await Pallet.create({
      title: "PalletForRow",
      row: { _id: row._id, title: row.title },
      rowData: { _id: row._id, title: row.title },
      poses: [],
    });
    // Добавим pallet в массив pallets у row
    row.pallets.push(pallet._id as Types.ObjectId);
    await row.save();
    mockRequest = {};

    // Act
    await getAllRows(mockRequest as Request, res);

    // Assert
    const foundRow = responseJson.find(
      (r: any) => r._id.toString() === (row._id as Types.ObjectId).toString()
    );
    expect(foundRow).toBeDefined();
    expect(Array.isArray(foundRow.pallets)).toBe(true);
    expect(foundRow.pallets[0].toString()).toBe(
      (pallet._id as Types.ObjectId).toString()
    );
    // Проверим, что pallet ссылается на row
    expect((pallet.rowData._id as Types.ObjectId).toString()).toBe(
      (row._id as Types.ObjectId).toString()
    );
    expect(pallet.rowData.title).toBe(row.title);
  });
});
