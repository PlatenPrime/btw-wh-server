import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Row } from "../../models/Row.js";
import { getRowById } from "../getRowById.js";

describe("getRowById Controller", () => {
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

  it("should return row by id", async () => {
    // Arrange
    const row = await Row.create({ title: "Row by ID" });
    // Создаем паллету, связанную с этим рядом
    const pallet = await Pallet.create({
      title: "Pallet for Row by ID",
      row: row._id, // Add this line to set the required row field
      rowData: { _id: row._id, title: row.title },
      sector: "test-sector",
    });
    mockRequest = { params: { id: (row._id as Types.ObjectId).toString() } };

    // Act
    await getRowById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.title).toBe("Row by ID");
    expect(responseJson._id).toBeDefined();
    // Проверяем pallets
    expect(Array.isArray(responseJson.pallets)).toBe(true);
    expect(responseJson.pallets.length).toBe(1);
    expect(responseJson.pallets[0]._id.toString()).toBe(
      (pallet._id as Types.ObjectId).toString()
    );
    expect(responseJson.pallets[0].title).toBe(pallet.title);
    expect(responseJson.pallets[0].sector).toBe(pallet.sector);
    expect(responseJson.pallets[0].isDef).toBe(false); // default value
  });

  it("should return pallet with isDef true", async () => {
    // Arrange
    const row = await Row.create({ title: "RowWithDefPalletById" });
    const pallet = await Pallet.create({
      title: "Defective Pallet by ID",
      row: row._id,
      rowData: { _id: row._id, title: row.title },
      sector: "def-sector",
      isDef: true,
    });
    mockRequest = { params: { id: (row._id as Types.ObjectId).toString() } };

    // Act
    await getRowById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.pallets[0].isDef).toBe(true);
  });

  it("should return 404 if row not found", async () => {
    // Arrange
    mockRequest = { params: { id: "000000000000000000000000" } };

    // Act
    await getRowById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Row not found");
  });

  it("should handle server error", async () => {
    // Arrange
    vi.spyOn(Row, "findById").mockRejectedValueOnce(new Error("DB error"));
    mockRequest = { params: { id: "123" } };

    // Act
    await getRowById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
