import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { renameBlock } from "../renameBlock.js";
describe("renameBlockController", () => {
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
    it("200: renames block successfully", async () => {
        const block = await Block.create({ title: "Old Name", order: 1, segs: [] });
        const req = {
            params: { id: block._id.toString() },
            body: { title: "New Name" },
        };
        await renameBlock(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Block renamed successfully");
        expect(responseJson.data.title).toBe("New Name");
    });
    it("400: invalid block ID format", async () => {
        const req = {
            params: { id: "invalid-id" },
            body: { title: "New Name" },
        };
        await renameBlock(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid block ID format");
    });
    it("400: validation error when title is empty", async () => {
        const block = await Block.create({ title: "Block A", order: 1, segs: [] });
        const req = {
            params: { id: block._id.toString() },
            body: { title: "" },
        };
        await renameBlock(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404: block not found", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { title: "New Name" },
        };
        await renameBlock(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Block not found");
    });
    it("409: duplicate title", async () => {
        await Block.create({ title: "Block A", order: 1, segs: [] });
        const blockB = await Block.create({ title: "Block B", order: 2, segs: [] });
        const req = {
            params: { id: blockB._id.toString() },
            body: { title: "Block A" },
        };
        await renameBlock(req, res);
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Block with this title already exists");
        expect(responseJson.duplicateFields).toContain("title");
    });
});
