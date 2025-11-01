import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Pos } from "../../models/Pos.js";
import { getPosesByArtikul } from "../index.js";

// Mock the Pos model
vi.mock("../../models/Pos.js", () => ({
  Pos: {
    find: vi.fn(),
  },
}));

// Mock the sortPosesByPalletTitle utility
vi.mock("../../utils/sortPosesByPalletTitle.js", () => ({
  sortPosesByPalletTitle: vi.fn((poses) => poses), // Just return poses as-is for testing
}));

describe("getPosesByArtikul", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockReq = {
      params: {},
    };
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if artikul parameter is missing", async () => {
    mockReq.params = {};

    await getPosesByArtikul(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Artikul parameter is required",
    });
  });

  it("should return 200 with empty data when no poses found (empty array)", async () => {
    mockReq.params = { artikul: "TEST123" };
    (Pos.find as any).mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    });

    await getPosesByArtikul(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      data: {
        total: 0,
        pogrebi: {
          poses: [],
          quant: 0,
          boxes: 0,
        },
        merezhi: {
          poses: [],
          quant: 0,
          boxes: 0,
        },
        totalQuant: 0,
        totalBoxes: 0,
      },
    });
  });

  // Удалён тест "should return 404 if database returns null" 
  // exec() всегда возвращает массив (пустой или с данными), никогда null
  // Пустой массив уже покрыт тестом "should return 200 with empty data when no poses found"

  it("should group poses by warehouse and return correct data", async () => {
    const mockPoses = [
      {
        _id: "1",
        artikul: "TEST123",
        sklad: "pogrebi",
        quant: 10,
        boxes: 2,
        palletData: { title: "A-1-1" },
        rowData: { title: "Row 1" },
        palletTitle: "A-1-1",
        rowTitle: "Row 1",
        pallet: "pallet1",
        row: "row1",
        limit: 100,
        comment: "Test comment",
      },
      {
        _id: "2",
        artikul: "TEST123",
        sklad: "merezhi",
        quant: 15,
        boxes: 3,
        palletData: { title: "B-2-1" },
        rowData: { title: "Row 2" },
        palletTitle: "B-2-1",
        rowTitle: "Row 2",
        pallet: "pallet2",
        row: "row2",
        limit: 100,
        comment: "Test comment 2",
      },
      {
        _id: "3",
        artikul: "TEST123",
        sklad: "pogrebi",
        quant: 5,
        boxes: 1,
        palletData: { title: "A-1-2" },
        rowData: { title: "Row 1" },
        palletTitle: "A-1-2",
        rowTitle: "Row 1",
        pallet: "pallet3",
        row: "row1",
        limit: 100,
        comment: "Test comment 3",
      },
    ];

    mockReq.params = { artikul: "TEST123" };
    (Pos.find as any).mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockPoses),
    });

    await getPosesByArtikul(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      data: {
        total: 3,
        pogrebi: {
          poses: [
            expect.objectContaining({
              _id: "1",
              sklad: "pogrebi",
              quant: 10,
              boxes: 2,
            }),
            expect.objectContaining({
              _id: "3",
              sklad: "pogrebi",
              quant: 5,
              boxes: 1,
            }),
          ],
          quant: 15,
          boxes: 3,
        },
        merezhi: {
          poses: [
            expect.objectContaining({
              _id: "2",
              sklad: "merezhi",
              quant: 15,
              boxes: 3,
            }),
          ],
          quant: 15,
          boxes: 3,
        },
        totalQuant: 30,
        totalBoxes: 6,
      },
    });
  });

  it("should handle poses with undefined sklad", async () => {
    const mockPoses = [
      {
        _id: "1",
        artikul: "TEST123",
        sklad: undefined,
        quant: 10,
        boxes: 2,
        palletData: { title: "A-1-1" },
        rowData: { title: "Row 1" },
        palletTitle: "A-1-1",
        rowTitle: "Row 1",
        pallet: "pallet1",
        row: "row1",
        limit: 100,
        comment: "Test comment",
      },
    ];

    mockReq.params = { artikul: "TEST123" };
    (Pos.find as any).mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockPoses),
    });

    await getPosesByArtikul(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      data: {
        total: 1,
        pogrebi: {
          poses: [],
          quant: 0,
          boxes: 0,
        },
        merezhi: {
          poses: [],
          quant: 0,
          boxes: 0,
        },
        totalQuant: 10,
        totalBoxes: 2,
      },
    });
  });

  it("should handle database errors", async () => {
    mockReq.params = { artikul: "TEST123" };
    (Pos.find as any).mockReturnValue({
      exec: vi.fn().mockRejectedValue(new Error("Database error")),
    });

    await getPosesByArtikul(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
    });
  });
});
