import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { getPalletByTitle } from "../getPalletByTitle.js";
describe("getPalletByTitle Controller", () => {
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
    });
    it("should return pallet by valid title", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: { _id: new Types.ObjectId(), title: "Test Row" },
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        mockRequest = { params: { title: "Test Pallet" } };
        // Act
        await getPalletByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Pallet retrieved successfully");
        expect(responseJson.data.title).toBe("Test Pallet");
        expect(responseJson.data._id.toString()).toBe(pallet.id);
    });
    it("should return 404 if pallet not found", async () => {
        // Arrange
        mockRequest = { params: { title: "NonExistentPallet" } };
        // Act
        await getPalletByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Pallet not found");
        expect(responseJson.data).toBe(null);
    });
    it("should return 400 for empty title", async () => {
        // Arrange
        mockRequest = { params: { title: "" } };
        // Act
        await getPalletByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid title parameter");
    });
    it("should return 400 for whitespace-only title", async () => {
        // Arrange
        mockRequest = { params: { title: "   " } };
        // Act
        await getPalletByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid title parameter");
    });
    it("should trim whitespace from title parameter", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: { _id: new Types.ObjectId(), title: "Test Row" },
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        mockRequest = { params: { title: "  Test Pallet  " } };
        // Act
        await getPalletByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Pallet retrieved successfully");
        expect(responseJson.data.title).toBe("Test Pallet");
    });
    it("should handle server error", async () => {
        // Arrange
        mockRequest = { params: { title: "Test Pallet" } };
        vi.spyOn(Pallet, "findOne").mockRejectedValueOnce(new Error("DB error"));
        // Act
        await getPalletByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
