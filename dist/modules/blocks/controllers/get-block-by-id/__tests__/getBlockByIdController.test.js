import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { getBlockById } from "../getBlockById.js";
describe("getBlockByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
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
    });
    it("200: returns block when found", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const req = {
            params: { id: block._id.toString() },
        };
        await getBlockById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Block retrieved successfully");
        expect(responseJson.data.title).toBe("Block A");
    });
    it("200: returns exists=false when block not found", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await getBlockById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Block not found");
        expect(responseJson.data).toBeNull();
    });
    it("400: invalid block ID format", async () => {
        const req = { params: { id: "invalid-id" } };
        await getBlockById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid block ID format");
    });
});
