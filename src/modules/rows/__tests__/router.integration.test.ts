import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { Row } from "../models/Row.js";

const createAuthHeader = (role: RoleType = RoleType.USER) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" }
  );
  return { Authorization: `Bearer ${token}` };
};

describe("Rows router integration", () => {
  beforeEach(async () => {
    await Row.deleteMany({});
  });

  describe("GET /api/rows", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/rows").expect(401);
    });

    it("200 returns all rows for USER", async () => {
      await Row.create({ title: "B Row", pallets: [] });
      await Row.create({ title: "A Row", pallets: [] });

      const response = await request(app)
        .get("/api/rows")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe("A Row");
    });
  });

  describe("GET /api/rows/id/:id", () => {
    it("200 returns row by id", async () => {
      const row = await Row.create({ title: "By Id Row", pallets: [] });

      const response = await request(app)
        .get(`/api/rows/id/${row._id.toString()}`)
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.exists).toBe(true);
      expect(response.body.data.title).toBe("By Id Row");
    });
  });

  describe("GET /api/rows/title/:title", () => {
    it("200 returns row by title", async () => {
      await Row.create({ title: "Unique Title Row", pallets: [] });

      const response = await request(app)
        .get("/api/rows/title/Unique%20Title%20Row")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.exists).toBe(true);
      expect(response.body.data.title).toBe("Unique Title Row");
    });
  });

  describe("POST /api/rows", () => {
    it("403 for USER role", async () => {
      await request(app)
        .post("/api/rows")
        .set(createAuthHeader(RoleType.USER))
        .send({ title: "New Row" })
        .expect(403);
    });

    it("201 creates row for ADMIN", async () => {
      const response = await request(app)
        .post("/api/rows")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "Integration Row" })
        .expect(201);

      expect(response.body.title).toBe("Integration Row");
      expect(await Row.countDocuments()).toBe(1);
    });
  });

  describe("PUT /api/rows/:id", () => {
    it("200 updates row for ADMIN", async () => {
      const row = await Row.create({ title: "Old Title", pallets: [] });

      const response = await request(app)
        .put(`/api/rows/${row._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "Updated Title" })
        .expect(200);

      expect(response.body.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/rows/:id", () => {
    it("403 for ADMIN role", async () => {
      const row = await Row.create({ title: "To Delete", pallets: [] });

      await request(app)
        .delete(`/api/rows/${row._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);
    });

    it("200 deletes row for PRIME", async () => {
      const row = await Row.create({ title: "To Delete", pallets: [] });

      await request(app)
        .delete(`/api/rows/${row._id.toString()}`)
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(await Row.findById(row._id)).toBeNull();
    });
  });
});
