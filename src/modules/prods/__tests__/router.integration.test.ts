import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { Prod } from "../models/Prod.js";

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

describe("Prods router integration", () => {
  beforeEach(async () => {
    await Prod.deleteMany({});
  });

  describe("GET /api/prods", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/prods").expect(401);
    });

    it("200 returns all prods for USER", async () => {
      await Prod.create({
        name: "acme",
        title: "Acme",
        imageUrl: "https://example.com/acme.png",
      });

      const response = await request(app)
        .get("/api/prods")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("acme");
    });
  });

  describe("GET /api/prods/id/:id", () => {
    it("200 returns prod by id", async () => {
      const prod = await Prod.create({
        name: "gemar",
        title: "Gemar",
        imageUrl: "https://example.com/gemar.png",
      });

      const response = await request(app)
        .get(`/api/prods/id/${prod._id.toString()}`)
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.data.name).toBe("gemar");
    });
  });

  describe("GET /api/prods/name/:name", () => {
    it("200 returns prod by name", async () => {
      await Prod.create({
        name: "belbal",
        title: "Belbal",
        imageUrl: "https://example.com/belbal.png",
      });

      const response = await request(app)
        .get("/api/prods/name/belbal")
        .set(createAuthHeader(RoleType.USER))
        .expect(200);

      expect(response.body.data.title).toBe("Belbal");
    });
  });

  describe("POST /api/prods", () => {
    it("403 for USER role", async () => {
      await request(app)
        .post("/api/prods")
        .set(createAuthHeader(RoleType.USER))
        .send({
          name: "newprod",
          title: "New Prod",
          imageUrl: "https://example.com/new.png",
        })
        .expect(403);
    });

    it("201 creates prod for ADMIN", async () => {
      const response = await request(app)
        .post("/api/prods")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({
          name: "newprod",
          title: "New Prod",
          imageUrl: "https://example.com/new.png",
        })
        .expect(201);

      expect(response.body.message).toBe("Prod created successfully");
      expect(response.body.data.name).toBe("newprod");
      expect(await Prod.countDocuments()).toBe(1);
    });
  });

  describe("PATCH /api/prods/id/:id", () => {
    it("200 updates prod for ADMIN", async () => {
      const prod = await Prod.create({
        name: "old",
        title: "Old",
        imageUrl: "https://example.com/old.png",
      });

      const response = await request(app)
        .patch(`/api/prods/id/${prod._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "Updated" })
        .expect(200);

      expect(response.body.data.title).toBe("Updated");
    });
  });

  describe("DELETE /api/prods/id/:id", () => {
    it("403 for ADMIN role", async () => {
      const prod = await Prod.create({
        name: "todelete",
        title: "To Delete",
        imageUrl: "https://example.com/del.png",
      });

      await request(app)
        .delete(`/api/prods/id/${prod._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);
    });

    it("200 deletes prod for PRIME", async () => {
      const prod = await Prod.create({
        name: "todelete",
        title: "To Delete",
        imageUrl: "https://example.com/del.png",
      });

      await request(app)
        .delete(`/api/prods/id/${prod._id.toString()}`)
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(await Prod.findById(prod._id)).toBeNull();
    });
  });
});
