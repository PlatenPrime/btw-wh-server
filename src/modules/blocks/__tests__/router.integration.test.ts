import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Block } from "../models/Block.js";
import { Seg } from "../../segs/models/Seg.js";
import { Zone } from "../../zones/models/Zone.js";

const createAuthHeader = (role: RoleType = RoleType.ADMIN) => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role },
    secret,
    { expiresIn: "1h" }
  );
  return { Authorization: `Bearer ${token}` };
};

describe("Blocks router integration", () => {
  describe("POST /api/blocks", () => {
    it("401 without auth token", async () => {
      await request(app)
        .post("/api/blocks")
        .send({ title: "Block A" })
        .expect(401);
    });

    it("403 for USER role", async () => {
      await request(app)
        .post("/api/blocks")
        .set(createAuthHeader(RoleType.USER))
        .send({ title: "Block A" })
        .expect(403);
    });

    it("201 creates block for ADMIN", async () => {
      const response = await request(app)
        .post("/api/blocks")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "Integration Block" })
        .expect(201);

      expect(response.body.message).toBe("Block created successfully");
      expect(response.body.data.title).toBe("Integration Block");
    });
  });

  describe("GET /api/blocks", () => {
    it("200 returns all blocks for ADMIN", async () => {
      await Block.create({ title: "Block A", order: 1, segs: [] });
      await Block.create({ title: "Block B", order: 2, segs: [] });

      const response = await request(app)
        .get("/api/blocks")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.exists).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/blocks/:id", () => {
    it("200 returns block by id", async () => {
      const block = await Block.create({ title: "Block A", order: 1, segs: [] });

      const response = await request(app)
        .get(`/api/blocks/${block._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.exists).toBe(true);
      expect(response.body.data.title).toBe("Block A");
    });

    it("400 for invalid id", async () => {
      await request(app)
        .get("/api/blocks/invalid-id")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(400);
    });
  });

  describe("PUT /api/blocks/:id", () => {
    it("200 updates block", async () => {
      const block = await Block.create({ title: "Block A", order: 1, segs: [] });

      const response = await request(app)
        .put(`/api/blocks/${block._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "Updated Block", order: 5 })
        .expect(200);

      expect(response.body.data.title).toBe("Updated Block");
      expect(response.body.data.order).toBe(5);
    });
  });

  describe("PATCH /api/blocks/:id/rename", () => {
    it("200 renames block", async () => {
      const block = await Block.create({ title: "Old Name", order: 1, segs: [] });

      const response = await request(app)
        .patch(`/api/blocks/${block._id.toString()}/rename`)
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "New Name" })
        .expect(200);

      expect(response.body.data.title).toBe("New Name");
    });
  });

  describe("POST /api/blocks/upsert", () => {
    it("403 for ADMIN role", async () => {
      await request(app)
        .post("/api/blocks/upsert")
        .set(createAuthHeader(RoleType.ADMIN))
        .send([{ title: "Block A", order: 1 }])
        .expect(403);
    });

    it("200 upserts blocks for PRIME", async () => {
      const response = await request(app)
        .post("/api/blocks/upsert")
        .set(createAuthHeader(RoleType.PRIME))
        .send([
          { title: "Upsert Block A", order: 1 },
          { title: "Upsert Block B", order: 2 },
        ])
        .expect(200);

      expect(response.body.message).toBe("Blocks upsert completed");
      expect(response.body.data.updatedBlocks).toHaveLength(2);
    });
  });

  describe("DELETE /api/blocks/:id", () => {
    it("403 for ADMIN role", async () => {
      const block = await Block.create({ title: "Block A", order: 1, segs: [] });

      await request(app)
        .delete(`/api/blocks/${block._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);
    });

    it("200 deletes block for PRIME", async () => {
      const block = await Block.create({ title: "Block A", order: 1, segs: [] });

      const response = await request(app)
        .delete(`/api/blocks/${block._id.toString()}`)
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.message).toBe("Block deleted successfully");

      const deleted = await Block.findById(block._id);
      expect(deleted).toBeNull();
    });
  });

  describe("POST /api/blocks/reset-zones-sectors", () => {
    it("200 resets all zone sectors", async () => {
      await Zone.create({ title: "42-1-1", bar: 420101, sector: 1001 });
      await Zone.create({ title: "42-1-2", bar: 420102, sector: 2002 });

      const response = await request(app)
        .post("/api/blocks/reset-zones-sectors")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe("Zones sectors reset successfully");
      expect(response.body.data.modifiedCount).toBe(2);

      const zones = await Zone.find({}).lean().exec();
      expect(zones.every((zone) => zone.sector === 0)).toBe(true);
    });
  });

  describe("POST /api/blocks/recalculate-zones-sectors", () => {
    it("200 recalculates zone sectors", async () => {
      const block = await Block.create({ title: "Block 1", order: 1, segs: [] });
      const zone = await Zone.create({ title: "42-2-1", bar: 420201, sector: 0 });
      await Seg.create({
        block: block._id,
        blockData: { _id: block._id, title: block.title },
        order: 1,
        sector: 0,
        zones: [{ _id: zone._id, title: zone.title }],
      });

      const response = await request(app)
        .post("/api/blocks/recalculate-zones-sectors")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe(
        "Zones sectors recalculated successfully"
      );
      expect(response.body.data.blocksProcessed).toBe(1);

      const updatedZone = await Zone.findById(zone._id).lean().exec();
      expect(updatedZone?.sector).toBe(1001);
    });
  });
});
