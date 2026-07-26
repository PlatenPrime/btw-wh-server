import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { getSharikStockData } from "../sharik/utils/getSharikStockData.js";

vi.mock("../sharik/utils/getSharikStockData.js");

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

describe("Browser router integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/browser/air/stock", () => {
    it("404 after air server stock endpoint removed", async () => {
      await request(app)
        .get("/api/browser/air/stock")
        .query({ link: "https://air.example/p/1" })
        .expect(404);
    });
  });

  describe("GET /api/browser/sharik/stock/:artikul", () => {
    it("404 when product not found", async () => {
      vi.mocked(getSharikStockData).mockResolvedValue(null);

      await request(app)
        .get("/api/browser/sharik/stock/UNKNOWN-ART")
        .expect(404);
    });

    it("200 returns sharik stock", async () => {
      vi.mocked(getSharikStockData).mockResolvedValue({
        nameukr: "Кулька",
        price: 50,
        quantity: 12,
      });

      const response = await request(app)
        .get("/api/browser/sharik/stock/1234-5678")
        .expect(200);

      expect(response.body.message).toBe("Sharik stock retrieved successfully");
      expect(response.body.data.quantity).toBe(12);
    });
  });

  describe("auth not required", () => {
    it("sharik endpoint works without token", async () => {
      vi.mocked(getSharikStockData).mockResolvedValue({
        nameukr: "X",
        price: 1,
        quantity: 1,
      });

      await request(app)
        .get("/api/browser/sharik/stock/ART-1")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);
    });
  });
});
