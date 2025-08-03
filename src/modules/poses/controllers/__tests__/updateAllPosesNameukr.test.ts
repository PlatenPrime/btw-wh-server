import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { Pos } from "../../models/Pos.js";
import { updateAllPosesNameukr } from "../updateAllPosesNameukr.js";

// Mock the models
vi.mock("../../models/Pos.js");
vi.mock("../../../arts/models/Art.js");

const mockPos = vi.mocked(Pos);
const mockArt = vi.mocked(Art);

describe("updateAllPosesNameukr", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should update all Pos documents with nameukr field", async () => {
    // Mock data
    const mockPoses = [
      {
        _id: "pos1",
        artikul: "ART001",
        nameukr: undefined,
      },
      {
        _id: "pos2",
        artikul: "ART002",
        nameukr: undefined,
      },
      {
        _id: "pos3",
        artikul: "ART003",
        nameukr: undefined,
      },
    ];

    const mockArts = [
      {
        artikul: "ART001",
        nameukr: "Товар 1",
      },
      {
        artikul: "ART002",
        nameukr: "Товар 2",
      },
      // ART003 not found in Art collection
    ];

    // Mock Pos.find to return all poses
    mockPos.find.mockResolvedValue(mockPoses as any);

    // Mock Art.findOne for each artikul
    mockArt.findOne
      .mockResolvedValueOnce(mockArts[0] as any) // ART001
      .mockResolvedValueOnce(mockArts[1] as any) // ART002
      .mockResolvedValueOnce(null); // ART003 not found

    // Mock Pos.updateOne for each update
    mockPos.updateOne.mockResolvedValue({ modifiedCount: 1 } as any);

    await updateAllPosesNameukr(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "Successfully updated Pos documents with nameukr field",
      updatedCount: 3,
      skippedCount: 0,
      errors: undefined,
    });

    // Verify that updateOne was called for each Pos document
    expect(mockPos.updateOne).toHaveBeenCalledTimes(3);
    expect(mockPos.updateOne).toHaveBeenCalledWith(
      { _id: "pos1" },
      { $set: { nameukr: "Товар 1" } }
    );
    expect(mockPos.updateOne).toHaveBeenCalledWith(
      { _id: "pos2" },
      { $set: { nameukr: "Товар 2" } }
    );
    expect(mockPos.updateOne).toHaveBeenCalledWith(
      { _id: "pos3" },
      { $set: { nameukr: "" } }
    );
  });

  it("should handle empty Pos collection", async () => {
    mockPos.find.mockResolvedValue([]);

    await updateAllPosesNameukr(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "No Pos documents found to update",
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
    });
  });

  it("should handle errors during processing", async () => {
    const mockPoses = [
      {
        _id: "pos1",
        artikul: "ART001",
        nameukr: undefined,
      },
    ];

    mockPos.find.mockResolvedValue(mockPoses as any);
    mockArt.findOne.mockRejectedValue(new Error("Database error"));

    await updateAllPosesNameukr(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "Successfully updated Pos documents with nameukr field",
      updatedCount: 0,
      skippedCount: 1,
      errors: [
        {
          artikul: "ART001",
          error: "Database error",
        },
      ],
    });
  });

  it("should handle database connection errors", async () => {
    mockPos.find.mockRejectedValue(new Error("Connection failed"));

    await updateAllPosesNameukr(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error during update process",
      error: "Connection failed",
    });
  });
});
