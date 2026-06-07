import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { createTestArt } from "../../../test/setup.js";
import { Art } from "../models/Art.js";

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

describe("Arts router integration", () => {
  describe("GET /api/arts", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/arts").expect(401);
    });

    it("200 returns arts for USER", async () => {
      await createTestArt({ artikul: "INT-001", zone: "A1" });
      await createTestArt({ artikul: "INT-002", zone: "A2" });

      const response = await request(app)
        .get("/api/arts")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/arts/artikul/:artikul", () => {
    it("200 returns art by artikul", async () => {
      await createTestArt({ artikul: "FIND-ME", zone: "Z1", nameukr: "Знайди" });

      const response = await request(app)
        .get("/api/arts/artikul/FIND-ME")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.exists).toBe(true);
      expect(response.body.data.artikul).toBe("FIND-ME");
    });
  });

  describe("GET /api/arts/zone/:zone", () => {
    it("200 returns arts by zone", async () => {
      await createTestArt({ artikul: "Z-001", zone: "42-1-1" });
      await createTestArt({ artikul: "Z-002", zone: "42-1-1" });
      await createTestArt({ artikul: "Z-003", zone: "42-2-1" });

      const response = await request(app)
        .get("/api/arts/zone/42-1-1")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("POST /api/arts/upsert", () => {
    it("403 for USER role", async () => {
      await request(app)
        .post("/api/arts/upsert")
        .set(createAuthHeader(RoleType.USER))
        .send([{ artikul: "UP-001", zone: "A1" }])
        .expect(403);
    });

    it("200 upserts arts for ADMIN", async () => {
      const response = await request(app)
        .post("/api/arts/upsert")
        .set(createAuthHeader(RoleType.ADMIN))
        .send([
          { artikul: "UP-001", zone: "A1", nameukr: "Upsert 1" },
          { artikul: "UP-002", zone: "A2", nameukr: "Upsert 2" },
        ])
        .expect(200);

      expect(response.body.message).toBe("Upsert completed");
      expect(await Art.countDocuments()).toBe(2);
    });
  });

  describe("POST /api/arts/btrade-stock/update-all", () => {
    it("403 for USER role", async () => {
      await request(app)
        .post("/api/arts/btrade-stock/update-all")
        .set(createAuthHeader(RoleType.USER))
        .expect(403);
    });

    it("202 starts update for ADMIN", async () => {
      const response = await request(app)
        .post("/api/arts/btrade-stock/update-all")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(202);

      expect(response.body.message).toBe("BtradeStock update process started");
    });
  });

  describe("DELETE /api/arts/without-latest-marker", () => {
    it("403 for ADMIN role", async () => {
      await request(app)
        .delete("/api/arts/without-latest-marker")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);
    });

    it("200 deletes outdated arts for PRIME", async () => {
      await createTestArt({ artikul: "OLD-001", zone: "A1", marker: "20250101" });
      await createTestArt({ artikul: "NEW-001", zone: "A1", marker: "20991231" });

      const response = await request(app)
        .delete("/api/arts/without-latest-marker")
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.message).toBe(
        "Arts without latest marker deleted successfully"
      );
      expect(await Art.findOne({ artikul: "OLD-001" })).toBeNull();
      expect(await Art.findOne({ artikul: "NEW-001" })).toBeTruthy();
    });
  });
});
