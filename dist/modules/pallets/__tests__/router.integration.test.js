import express from "express";
import { Types } from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { Pallet } from "../models/Pallet.js";
import palletRouter from "../router.js";
const createTestPallet = async (data = {}) => {
    return await Pallet.create({
        title: data.title || `Test Pallet ${Date.now()}`,
        row: data.row || { _id: new Types.ObjectId(), title: "Test Row" },
        poses: data.poses || [],
        sector: data.sector,
    });
};
describe("Pallets Router Integration Tests", () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use("/api/pallets", palletRouter);
    });
    it("POST /api/pallets - create pallet", async () => {
        const res = await request(app)
            .post("/api/pallets")
            .send({
            title: "Integration Pallet",
            row: { _id: new Types.ObjectId(), title: "Row" },
        })
            .expect(201);
        expect(res.body.title).toBe("Integration Pallet");
    });
    it("GET /api/pallets - get all pallets", async () => {
        await createTestPallet({ title: "P1" });
        await createTestPallet({ title: "P2" });
        const res = await request(app).get("/api/pallets").expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
    it("GET /api/pallets/:id - get pallet by id", async () => {
        const pallet = await createTestPallet({ title: "FindMe" });
        const res = await request(app).get(`/api/pallets/${pallet.id}`).expect(200);
        expect(res.body.title).toBe("FindMe");
    });
    it("PUT /api/pallets/:id - update pallet", async () => {
        const pallet = await createTestPallet({ title: "ToUpdate" });
        const res = await request(app)
            .put(`/api/pallets/${pallet.id}`)
            .send({ title: "Updated" })
            .expect(200);
        expect(res.body.title).toBe("Updated");
    });
    it("DELETE /api/pallets/:id - delete pallet", async () => {
        const pallet = await createTestPallet();
        const res = await request(app)
            .delete(`/api/pallets/${pallet.id}`)
            .expect(200);
        expect(res.body.message).toBe("Pallet deleted");
    });
    it("GET /api/pallets/by-row/:rowId - get pallets by rowId", async () => {
        const rowId = new Types.ObjectId();
        await createTestPallet({ row: { _id: rowId, title: "RowX" } });
        const res = await request(app)
            .get(`/api/pallets/by-row/${rowId}`)
            .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].row._id.toString()).toBe(rowId.toString());
    });
    it("POST /api/pallets/move-poses - move poses", async () => {
        const pallet = await createTestPallet({ poses: [new Types.ObjectId()] });
        const res = await request(app)
            .post("/api/pallets/move-poses")
            .send({ palletId: pallet.id, poses: [new Types.ObjectId().toString()] })
            .expect(200);
        expect(res.body.message).toBeDefined();
    });
    it("DELETE /api/pallets/:id/poses - delete poses", async () => {
        const poseId = new Types.ObjectId();
        const pallet = await createTestPallet({ poses: [poseId] });
        const res = await request(app)
            .delete(`/api/pallets/${pallet.id}/poses`)
            .send({ poses: [poseId.toString()] })
            .expect(200);
        expect(res.body.message).toBeDefined();
    });
});
