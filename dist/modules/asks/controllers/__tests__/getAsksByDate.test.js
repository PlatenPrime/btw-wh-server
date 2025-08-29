import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Ask } from "../../models/Ask.js";
import { getAsksByDate } from "../getAsksByDate.js";
// Mock the Ask model
vi.mock("../../models/Ask.js", () => ({
    Ask: {
        find: vi.fn(),
    },
}));
describe("getAsksByDate", () => {
    let mockRequest;
    let mockResponse;
    let mockAskFind;
    beforeEach(() => {
        mockAskFind = {
            sort: vi.fn().mockReturnThis(),
        };
        Ask.find = vi.fn().mockReturnValue(mockAskFind);
        mockRequest = {
            query: {},
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    it("should return 400 if date is not provided", async () => {
        await getAsksByDate(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Date parameter is required in query string",
        });
    });
    it("should return 400 if date format is invalid", async () => {
        mockRequest.query = { date: "invalid-date" };
        await getAsksByDate(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Invalid date format. Please provide a valid date string",
        });
    });
    it("should return asks for a valid date", async () => {
        const mockAsks = [
            {
                _id: "1",
                artikul: "ART001",
                nameukr: "Test Product",
                status: "new",
                createdAt: new Date("2024-01-15T10:00:00Z"),
            },
            {
                _id: "2",
                artikul: "ART002",
                nameukr: "Test Product 2",
                status: "completed",
                createdAt: new Date("2024-01-15T15:00:00Z"),
            },
        ];
        mockAskFind.sort.mockResolvedValue(mockAsks);
        mockRequest.query = { date: "2024-01-15" };
        await getAsksByDate(mockRequest, mockResponse);
        expect(Ask.find).toHaveBeenCalledWith({
            createdAt: {
                $gte: expect.any(Date),
                $lte: expect.any(Date),
            },
        });
        expect(mockAskFind.sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Found 2 asks for 2024-01-15",
            data: mockAsks,
            date: "2024-01-15",
            count: 2,
        });
    });
    it("should handle empty results", async () => {
        mockAskFind.sort.mockResolvedValue([]);
        mockRequest.query = { date: "2024-01-16" };
        await getAsksByDate(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Found 0 asks for 2024-01-16",
            data: [],
            date: "2024-01-16",
            count: 0,
        });
    });
    it("should handle server errors", async () => {
        const error = new Error("Database connection failed");
        mockAskFind.sort.mockRejectedValue(error);
        mockRequest.query = { date: "2024-01-15" };
        await getAsksByDate(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Server error while fetching asks by date",
            error: "Database connection failed",
        });
    });
});
