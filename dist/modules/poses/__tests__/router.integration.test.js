import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { createTestPallet, createTestPos, createTestRow, } from "../../../test/utils/testHelpers.js";
import { Pos } from "../models/Pos.js";
const createAuthHeader = (role = RoleType.USER) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Poses router integration", () => {
    let row;
    let pallet;
    beforeEach(async () => {
        await Pos.deleteMany({});
        row = await createTestRow({ title: `Row-${Date.now()}` });
        pallet = await createTestPallet({
            title: `Pallet-${Date.now()}`,
            row: { _id: row._id, title: row.title },
        });
    });
    describe("GET /api/poses", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/poses").expect(401);
        });
        it("200 returns poses for USER", async () => {
            await createTestPos({
                pallet: { _id: pallet._id, title: pallet.title },
                row: { _id: row._id, title: row.title },
                artikul: "INT-ART-1",
            });
            const response = await request(app)
                .get("/api/poses")
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].artikul).toBe("INT-ART-1");
        });
    });
    describe("GET /api/poses/:id", () => {
        it("200 returns pos by id", async () => {
            const pos = await createTestPos({
                pallet: { _id: pallet._id, title: pallet.title },
                row: { _id: row._id, title: row.title },
                artikul: "INT-ART-2",
            });
            const response = await request(app)
                .get(`/api/poses/${pos._id.toString()}`)
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.exists).toBe(true);
            expect(response.body.data.artikul).toBe("INT-ART-2");
        });
    });
    describe("POST /api/poses", () => {
        it("403 for USER role", async () => {
            await request(app)
                .post("/api/poses")
                .set(createAuthHeader(RoleType.USER))
                .send({
                palletId: pallet._id.toString(),
                rowId: row._id.toString(),
                artikul: "NEW-ART",
                quant: 5,
                boxes: 1,
            })
                .expect(403);
        });
        it("201 creates pos for EDITOR", async () => {
            const response = await request(app)
                .post("/api/poses")
                .set(createAuthHeader(RoleType.EDITOR))
                .send({
                palletId: pallet._id.toString(),
                rowId: row._id.toString(),
                artikul: "NEW-ART",
                quant: 5,
                boxes: 1,
                sklad: "merezhi",
            })
                .expect(201);
            expect(response.body.artikul).toBe("NEW-ART");
            expect(await Pos.countDocuments({ artikul: "NEW-ART" })).toBe(1);
        });
    });
    describe("DELETE /api/poses/:id", () => {
        it("200 deletes pos for EDITOR", async () => {
            const pos = await createTestPos({
                pallet: { _id: pallet._id, title: pallet.title },
                row: { _id: row._id, title: row.title },
            });
            await request(app)
                .delete(`/api/poses/${pos._id.toString()}`)
                .set(createAuthHeader(RoleType.EDITOR))
                .expect(200);
            expect(await Pos.findById(pos._id)).toBeNull();
        });
    });
    describe("POST /api/poses/export-stocks", () => {
        it("403 for EDITOR role", async () => {
            await request(app)
                .post("/api/poses/export-stocks")
                .set(createAuthHeader(RoleType.EDITOR))
                .send({})
                .expect(403);
        });
        it("200 exports stocks for ADMIN", async () => {
            await createTestPos({
                pallet: { _id: pallet._id, title: pallet.title },
                row: { _id: row._id, title: row.title },
                artikul: "EXPORT-ART",
                quant: 10,
                sklad: "merezhi",
            });
            const response = await request(app)
                .post("/api/poses/export-stocks")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ sklad: "merezhi" })
                .buffer(true)
                .parse((res, callback) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
                res.on("end", () => callback(null, Buffer.concat(chunks)));
            })
                .expect(200);
            expect(response.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            expect(Buffer.isBuffer(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });
});
