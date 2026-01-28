import request from "supertest";
import mongoose from "mongoose";
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import app from "../../../../../test/utils/testApp.js";
describe("GET /api/pallet-groups", () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect("mongodb://127.0.0.1:27017/btw-wh-server-test");
        }
        await Pallet.deleteMany({});
        await PalletGroup.deleteMany({});
        const pallet = await Pallet.create({
            title: "P1",
            row: new mongoose.Types.ObjectId(),
            rowData: { _id: new mongoose.Types.ObjectId(), title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 0,
        });
        await PalletGroup.create({
            title: "Group 1",
            order: 1,
            pallets: [pallet._id],
        });
    });
    afterAll(async () => {
        await mongoose.connection.close();
    });
    it("returns pallet groups with pallets as PalletShortDto[]", async () => {
        const response = await request(app).get("/api/pallet-groups").expect(200);
        expect(response.body).toHaveProperty("data");
        const [group] = response.body.data;
        expect(group).toHaveProperty("pallets");
        expect(Array.isArray(group.pallets)).toBe(true);
        const [pallet] = group.pallets;
        expect(pallet).toHaveProperty("id");
        expect(pallet).toHaveProperty("title");
        expect(pallet).toHaveProperty("sector");
        expect(pallet).toHaveProperty("isDef");
        expect(pallet).toHaveProperty("isEmpty");
    });
});
