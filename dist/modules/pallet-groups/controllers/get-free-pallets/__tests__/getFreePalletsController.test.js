import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../../../../../test/utils/testApp.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
const getAuthHeader = () => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: "USER" }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("GET /api/pallet-groups/free-pallets", () => {
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect("mongodb://127.0.0.1:27017/btw-wh-server-test");
        }
    });
    beforeEach(async () => {
        await Pallet.deleteMany({});
        await PalletGroup.deleteMany({});
        const palletP1 = await Pallet.create({
            title: "P1",
            row: new mongoose.Types.ObjectId(),
            rowData: { _id: new mongoose.Types.ObjectId(), title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 0,
        });
        await Pallet.create({
            title: "P2",
            row: new mongoose.Types.ObjectId(),
            rowData: { _id: new mongoose.Types.ObjectId(), title: "Row 1" },
            poses: [],
            isDef: false,
            sector: 0,
        });
        await PalletGroup.create({
            title: "Group 1",
            order: 1,
            pallets: [palletP1._id],
        });
    });
    it("returns 200 and free pallets as PalletShortDto[] (only P2 when P1 is in group)", async () => {
        const response = await request(app)
            .get("/api/pallet-groups/free-pallets")
            .set(getAuthHeader())
            .expect(200);
        expect(response.body).toHaveProperty("message", "Free pallets fetched successfully");
        expect(response.body).toHaveProperty("data");
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(1);
        const [pallet] = response.body.data;
        expect(pallet).toHaveProperty("id");
        expect(pallet).toHaveProperty("title", "P2");
        expect(pallet).toHaveProperty("sector");
        expect(pallet).toHaveProperty("isDef");
        expect(pallet).toHaveProperty("isEmpty");
    });
    it("returns empty data when all pallets are in groups", async () => {
        const palletP2 = await Pallet.findOne({ title: "P2" }).exec();
        if (!palletP2)
            throw new Error("P2 not found");
        const group = await PalletGroup.findOne({ title: "Group 1" }).exec();
        if (!group)
            throw new Error("Group 1 not found");
        group.pallets.push(palletP2._id);
        await group.save();
        const response = await request(app)
            .get("/api/pallet-groups/free-pallets")
            .set(getAuthHeader())
            .expect(200);
        expect(response.body.data).toHaveLength(0);
    });
});
