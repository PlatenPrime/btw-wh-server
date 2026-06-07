import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../../test/utils/testApp.js";
import { RoleType } from "../../../constants/roles.js";
import { Kask } from "../models/Kask.js";

vi.mock("../../../utils/telegram/sendMessageToKasaChat.js", () => ({
  sendMessageToKasaChat: vi.fn(),
}));

const getAuthHeader = (role: string = RoleType.USER) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" },
  );
  return { Authorization: `Bearer ${token}` };
};

describe("Kasks Router Integration", () => {
  beforeEach(async () => {
    await Kask.deleteMany({});
  });

  describe("POST /api/kasks", () => {
    it("401 without auth token", async () => {
      await request(app)
        .post("/api/kasks")
        .send({
          artikul: "1234-5678",
          nameukr: "Товар",
          zone: "A1",
        })
        .expect(401);
    });

    it("201 creates kask for authenticated USER", async () => {
      const response = await request(app)
        .post("/api/kasks")
        .set(getAuthHeader(RoleType.USER))
        .send({
          artikul: "1234-5678",
          nameukr: "Кулька",
          zone: "42-5-1",
          quant: 2,
        })
        .expect(201);

      expect(response.body.artikul).toBe("1234-5678");
      expect(response.body.nameukr).toBe("Кулька");
      expect(response.body.zone).toBe("42-5-1");
      expect(response.body.quant).toBe(2);
      expect(await Kask.countDocuments()).toBe(1);
    });

    it("400 when validation fails", async () => {
      const response = await request(app)
        .post("/api/kasks")
        .set(getAuthHeader(RoleType.USER))
        .send({ nameukr: "Без artikul", zone: "A1" })
        .expect(400);

      expect(response.body.message).toBe("Validation error");
    });
  });

  describe("GET /api/kasks/by-date", () => {
    it("200 returns kasks for date", async () => {
      await Kask.create({
        artikul: "1111-1111",
        nameukr: "First",
        zone: "A1",
        createdAt: new Date("2025-02-02T10:00:00.000Z"),
      });
      await Kask.create({
        artikul: "2222-2222",
        nameukr: "Second",
        zone: "A2",
        createdAt: new Date("2025-02-02T18:00:00.000Z"),
      });

      const response = await request(app)
        .get("/api/kasks/by-date")
        .query({ date: "2025-02-02" })
        .set(getAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it("400 for invalid date", async () => {
      await request(app)
        .get("/api/kasks/by-date")
        .query({ date: "invalid" })
        .set(getAuthHeader(RoleType.USER))
        .expect(400);
    });
  });

  describe("GET /api/kasks/:id", () => {
    it("200 returns kask when found", async () => {
      const kask = await Kask.create({
        artikul: "1234-5678",
        nameukr: "Кулька",
        zone: "A1",
      });

      const response = await request(app)
        .get(`/api/kasks/${String(kask._id)}`)
        .set(getAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.exists).toBe(true);
      expect(response.body.data.artikul).toBe("1234-5678");
    });

    it("200 with exists false when not found", async () => {
      const response = await request(app)
        .get("/api/kasks/000000000000000000000000")
        .set(getAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.exists).toBe(false);
      expect(response.body.data).toBeNull();
    });
  });

  describe("PATCH /api/kasks/:id", () => {
    it("200 updates kask fields", async () => {
      const kask = await Kask.create({
        artikul: "1234-5678",
        nameukr: "Старе",
        zone: "A1",
      });

      const response = await request(app)
        .patch(`/api/kasks/${String(kask._id)}`)
        .set(getAuthHeader(RoleType.USER))
        .send({ nameukr: "Нове", quant: 3 })
        .expect(200);

      expect(response.body.data.nameukr).toBe("Нове");
      expect(response.body.data.quant).toBe(3);
    });
  });

  describe("DELETE /api/kasks/:id", () => {
    it("403 for USER role", async () => {
      const kask = await Kask.create({
        artikul: "1234-5678",
        nameukr: "To delete",
        zone: "A1",
      });

      await request(app)
        .delete(`/api/kasks/${String(kask._id)}`)
        .set(getAuthHeader(RoleType.USER))
        .expect(403);

      expect(await Kask.findById(kask._id)).toBeTruthy();
    });

    it("200 deletes kask for PRIME role", async () => {
      const kask = await Kask.create({
        artikul: "5555-5555",
        nameukr: "To delete",
        zone: "A1",
      });

      const response = await request(app)
        .delete(`/api/kasks/${String(kask._id)}`)
        .set(getAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.message).toBe("Kask deleted successfully");
      expect(await Kask.findById(kask._id)).toBeNull();
    });
  });
});
