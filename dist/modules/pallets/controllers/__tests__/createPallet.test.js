import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Row } from "../../../rows/models/Row.js";
import { Pallet } from "../../models/Pallet.js";
import { createPallet } from "../createPallet.js";
// Mock session
const mockSession = {
    withTransaction: vi.fn().mockImplementation(async (fn) => {
        return await fn();
    }),
    endSession: vi.fn().mockResolvedValue(undefined),
};
const validRowData = { _id: new Types.ObjectId(), title: "Test Row" };
describe("createPallet Controller", () => {
    let mockRequest;
    let responseJson;
    let responseStatus;
    let res;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
        };
        vi.clearAllMocks();
        // Mock Pallet.startSession
        vi.spyOn(Pallet, "startSession").mockResolvedValue(mockSession);
    });
    it("should create a new pallet with default isDef", async () => {
        // Arrange
        const rowDoc = {
            _id: validRowData._id,
            title: validRowData.title,
            pallets: [],
            save: vi.fn().mockResolvedValue(undefined),
        };
        mockRequest = {
            body: {
                title: "New Pallet",
                row: rowDoc._id,
                rowData: { _id: rowDoc._id, title: rowDoc.title },
            },
        };
        vi.spyOn(Row, "findById").mockReturnValueOnce({
            session: vi.fn().mockResolvedValue(rowDoc),
        });
        vi.spyOn(Pallet, "create").mockImplementationOnce(async (...args) => [
            {
                ...args[0][0],
                _id: new Types.ObjectId(),
                isDef: args[0][0].isDef || false,
                toObject() {
                    return this;
                },
            },
        ]);
        // Act
        await createPallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.title).toBe("New Pallet");
        expect(responseJson.isDef).toBe(false); // Default value
    });
    it("should create a pallet with isDef field", async () => {
        // Arrange
        const rowDoc = {
            _id: validRowData._id,
            title: validRowData.title,
            pallets: [],
            save: vi.fn().mockResolvedValue(undefined),
        };
        mockRequest = {
            body: {
                title: "Def Pallet",
                row: rowDoc._id,
                rowData: { _id: rowDoc._id, title: rowDoc.title },
                isDef: true,
            },
        };
        vi.spyOn(Row, "findById").mockReturnValueOnce({
            session: vi.fn().mockResolvedValue(rowDoc),
        });
        vi.spyOn(Pallet, "create").mockImplementationOnce(async (...args) => [
            {
                ...args[0][0],
                _id: new Types.ObjectId(),
                isDef: args[0][0].isDef || false,
                toObject() {
                    return this;
                },
            },
        ]);
        // Act
        await createPallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.title).toBe("Def Pallet");
        expect(responseJson.isDef).toBe(true);
    });
    it("should return 400 if title or rowData is missing", async () => {
        // Arrange
        mockRequest = { body: { rowData: validRowData } };
        await createPallet(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBeDefined();
        mockRequest = { body: { title: "No Row" } };
        await createPallet(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBeDefined();
    });
    it("should handle server error", async () => {
        // Arrange
        mockRequest = { body: { title: "Err Pallet", rowData: validRowData } };
        vi.spyOn(Row, "findById").mockReturnValueOnce({
            session: vi.fn().mockResolvedValue({
                _id: validRowData._id,
                title: validRowData.title,
                pallets: [],
                save: vi.fn().mockResolvedValue(undefined),
            }),
        });
        vi.spyOn(Pallet, "create").mockRejectedValueOnce(new Error("DB error"));
        // Act
        await createPallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
