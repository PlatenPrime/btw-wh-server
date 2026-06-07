import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../../test/utils/testApp.js";
import { Block } from "../../blocks/models/Block.js";
import { Zone } from "../../zones/models/Zone.js";
import { Seg } from "../models/Seg.js";

const getAdminAuthHeader = () => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role: "ADMIN" },
    secret,
    { expiresIn: "1h" }
  );
  return { Authorization: `Bearer ${token}` };
};

const getUserAuthHeader = () => {
  const secret =
    process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
  const token = jwt.sign(
    { id: new mongoose.Types.ObjectId().toString(), role: "USER" },
    secret,
    { expiresIn: "1h" }
  );
  return { Authorization: `Bearer ${token}` };
};

const createZone = async () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 99) + 1;
  return Zone.create({
    title: `42-${(timestamp % 99) + 1}-${random}`,
    bar: Math.max(1, Math.floor(Math.random() * 1_000_000)),
    sector: 0,
  });
};

describe("Segs Router Integration", () => {
  beforeEach(async () => {
    await Block.deleteMany({});
    await Zone.deleteMany({});
    await Seg.deleteMany({});
  });

  it("GET /api/segs returns 401 without auth", async () => {
    await request(app).get("/api/segs").expect(401);
  });

  it("GET /api/segs returns 403 for non-admin user", async () => {
    await request(app)
      .get("/api/segs")
      .set(getUserAuthHeader())
      .expect(403);
  });

  it("GET /api/segs returns all segments for admin", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
    await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    const response = await request(app)
      .get("/api/segs")
      .set(getAdminAuthHeader())
      .expect(200);

    expect(response.body.exists).toBe(true);
    expect(response.body.message).toBe("Segments retrieved successfully");
    expect(response.body.data).toHaveLength(1);
  });

  it("POST /api/segs creates segment for admin", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-c`, order: 2, segs: [] });
    const zone = await createZone();

    const response = await request(app)
      .post("/api/segs")
      .set(getAdminAuthHeader())
      .send({
        blockData: { _id: block._id.toString(), title: block.title },
        order: 1,
        zones: [zone._id.toString()],
      })
      .expect(201);

    expect(response.body.message).toBe("Segment created successfully");
    expect(response.body.data.order).toBe(1);
    expect(response.body.data.sector).toBe(2001);
  });

  it("GET /api/segs/by-block/:blockId returns segments for block", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-b`, order: 1, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    const response = await request(app)
      .get(`/api/segs/by-block/${block._id.toString()}`)
      .set(getAdminAuthHeader())
      .expect(200);

    expect(response.body.exists).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(seg._id.toString());
  });

  it("GET /api/segs/:id returns segment by id", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-id`, order: 1, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    const response = await request(app)
      .get(`/api/segs/${seg._id.toString()}`)
      .set(getAdminAuthHeader())
      .expect(200);

    expect(response.body.exists).toBe(true);
    expect(response.body.data._id).toBe(seg._id.toString());
  });

  it("GET /api/segs/:segId/zones returns zones for segment", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-z`, order: 1, segs: [] });
    const zone = await createZone();
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [{ _id: zone._id, title: zone.title }],
    });

    await Zone.updateOne(
      { _id: zone._id },
      { $set: { "seg.id": seg._id, sector: seg.sector } }
    );

    const response = await request(app)
      .get(`/api/segs/${seg._id.toString()}/zones`)
      .set(getAdminAuthHeader())
      .expect(200);

    expect(response.body.exists).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(zone._id.toString());
  });

  it("PUT /api/segs/:id updates segment", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-u`, order: 3, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 3001,
      zones: [],
    });

    const response = await request(app)
      .put(`/api/segs/${seg._id.toString()}`)
      .set(getAdminAuthHeader())
      .send({ order: 4 })
      .expect(200);

    expect(response.body.message).toBe("Segment updated successfully");
    expect(response.body.data.order).toBe(4);
    expect(response.body.data.sector).toBe(3004);
  });

  it("DELETE /api/segs/:id deletes segment", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-d`, order: 1, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    const response = await request(app)
      .delete(`/api/segs/${seg._id.toString()}`)
      .set(getAdminAuthHeader())
      .expect(200);

    expect(response.body.message).toBe("Segment deleted successfully");
    expect(response.body.data._id).toBe(seg._id.toString());
    expect(await Seg.findById(seg._id).exec()).toBeNull();
  });

  it("POST /api/segs/upsert upserts segments", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-up`, order: 1, segs: [] });
    const zone = await createZone();

    const response = await request(app)
      .post("/api/segs/upsert")
      .set(getAdminAuthHeader())
      .send([
        {
          blockId: block._id.toString(),
          order: 1,
          zones: [zone._id.toString()],
        },
      ])
      .expect(200);

    expect(response.body.message).toBe("Segments upsert completed");
    expect(response.body.data.processedSegs).toHaveLength(1);

    const createdSeg = await Seg.findOne({ block: block._id }).exec();
    expect(createdSeg).not.toBeNull();
  });

  it("POST /api/segs returns 400 for invalid body", async () => {
    const response = await request(app)
      .post("/api/segs")
      .set(getAdminAuthHeader())
      .send({ order: 1 })
      .expect(400);

    expect(response.body.message).toBe("Validation error");
  });
});
