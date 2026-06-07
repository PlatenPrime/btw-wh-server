import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Konk } from "../models/Konk.js";

const createAuthHeader = (role: RoleType = RoleType.ADMIN) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" },
  );
  return { Authorization: `Bearer ${token}` };
};

const createKonkPayload = (suffix: string) => ({
  name: `konk-${suffix}`,
  title: `Konk ${suffix}`,
  url: `https://example.com/${suffix}`,
  imageUrl: `https://example.com/${suffix}.png`,
  recountDays: ["2026-04-01"],
});

describe("Konks router integration", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  describe("GET /api/konks", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/konks").expect(401);
    });

    it("403 for USER role", async () => {
      await request(app)
        .get("/api/konks")
        .set(createAuthHeader(RoleType.USER))
        .expect(403);
    });

    it("200 returns all konks for ADMIN", async () => {
      await Konk.create(createKonkPayload("a"));
      await Konk.create(createKonkPayload("b"));

      const response = await request(app)
        .get("/api/konks")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe("Konks retrieved successfully");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/konks/id/:id", () => {
    it("200 returns konk when found", async () => {
      const konk = await Konk.create(createKonkPayload("id"));

      const response = await request(app)
        .get(`/api/konks/id/${konk._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe("Konk retrieved successfully");
      expect(response.body.data.name).toBe("konk-id");
    });
  });

  describe("GET /api/konks/name/:name", () => {
    it("200 returns konk by name", async () => {
      await Konk.create(createKonkPayload("byname"));

      const response = await request(app)
        .get("/api/konks/name/konk-byname")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe("Konk retrieved successfully");
      expect(response.body.data.title).toBe("Konk byname");
    });
  });

  describe("POST /api/konks", () => {
    it("201 creates konk for ADMIN", async () => {
      const response = await request(app)
        .post("/api/konks")
        .set(createAuthHeader(RoleType.ADMIN))
        .send(createKonkPayload("new"))
        .expect(201);

      expect(response.body.message).toBe("Konk created successfully");
      expect(response.body.data.name).toBe("konk-new");
      expect(await Konk.countDocuments()).toBe(1);
    });

    it("400 when validation fails", async () => {
      await request(app)
        .post("/api/konks")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "Missing name" })
        .expect(400);
    });
  });

  describe("PATCH /api/konks/id/:id", () => {
    it("200 updates konk for ADMIN", async () => {
      const konk = await Konk.create(createKonkPayload("upd"));

      const response = await request(app)
        .patch(`/api/konks/id/${konk._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "Updated Title" })
        .expect(200);

      expect(response.body.message).toBe("Konk updated successfully");
      expect(response.body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/konks/id/:id", () => {
    it("403 for ADMIN role", async () => {
      const konk = await Konk.create(createKonkPayload("del"));

      await request(app)
        .delete(`/api/konks/id/${konk._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);

      expect(await Konk.findById(konk._id)).toBeTruthy();
    });

    it("200 deletes konk for PRIME", async () => {
      const konk = await Konk.create(createKonkPayload("prime-del"));

      const response = await request(app)
        .delete(`/api/konks/id/${konk._id.toString()}`)
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.message).toBe("Konk deleted successfully");
      expect(await Konk.findById(konk._id)).toBeNull();
    });
  });
});
