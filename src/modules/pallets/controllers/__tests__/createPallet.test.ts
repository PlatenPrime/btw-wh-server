import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Row } from "../../../rows/models/Row.js";
import { Pallet } from "../../models/Pallet.js";
import { createPallet } from "../createPallet.js";

const validRow = { _id: new Types.ObjectId(), title: "Test Row" };

describe("createPallet Controller", () => {
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

  it("should create a new pallet", async () => {
    // Arrange
    const rowDoc = await Row.create({
      _id: validRow._id,
      title: validRow.title,
      pallets: [],
    });
    mockRequest = {
      body: {
        title: "New Pallet",
        row: { _id: rowDoc._id, title: rowDoc.title },
        rowData: { _id: rowDoc._id, title: rowDoc.title },
      },
    };
    vi.spyOn(Pallet, "create").mockImplementationOnce(
      async (...args: any[]) => [
        {
          ...args[0][0],
          _id: new Types.ObjectId(),
          toObject() {
            return this;
          },
        },
      ]
    );
    // Act
    await createPallet(mockRequest as Request, res);
    // Debug: log error if not 201
    if (responseStatus.code !== 201) {
      // eslint-disable-next-line no-console
      console.error("Test createPallet: ", responseStatus, responseJson);
    }
    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.title).toBe("New Pallet");
    expect(responseJson.rowData.title).toBe("Test Row");
  });

  it("should return 400 if title or row is missing", async () => {
    // Arrange
    mockRequest = { body: { row: validRow } };
    await createPallet(mockRequest as Request, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBeDefined();

    mockRequest = { body: { title: "No Row" } };
    await createPallet(mockRequest as Request, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBeDefined();
  });

  it("should handle server error", async () => {
    // Arrange
    mockRequest = { body: { title: "Err Pallet", row: validRow } };
    vi.spyOn(Row, "findById").mockResolvedValueOnce({
      _id: validRow._id,
      title: validRow.title,
      pallets: [],
      save: vi.fn().mockResolvedValue(undefined),
    });
    vi.spyOn(Pallet, "create").mockRejectedValueOnce(new Error("DB error"));
    // Act
    await createPallet(mockRequest as Request, res);
    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
