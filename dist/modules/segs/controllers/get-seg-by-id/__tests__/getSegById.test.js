import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Block } from "../../../../blocks/models/Block.js";
import { Seg } from "../../../models/Seg.js";
import { getSegById } from "../getSegById.js";
describe("getSegById Controller", () => {
    let mockRequest;
    let responseJson;
    let responseStatus;
    let res;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
        };
    });
    it("200: returns segment when found", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        mockRequest = { params: { id: seg._id.toString() } };
        await getSegById(mockRequest, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Segment retrieved successfully");
        expect(String(responseJson.data._id)).toBe(seg._id.toString());
    });
    it("200: returns exists false when segment not found", async () => {
        mockRequest = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await getSegById(mockRequest, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Segment not found");
        expect(responseJson.data).toBeNull();
    });
    it("400: invalid segment id format", async () => {
        mockRequest = { params: { id: "not-valid" } };
        await getSegById(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(Array.isArray(responseJson.errors)).toBe(true);
    });
});
