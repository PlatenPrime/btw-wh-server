import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Pallet } from "../../pallets/models/Pallet.js";
import { PalletGroup } from "../models/PalletGroup.js";

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

const createPallet = async (title: string) => {
  const rowId = new mongoose.Types.ObjectId();
  return Pallet.create({
    title,
    row: rowId,
    rowData: { _id: rowId, title: "Row 1" },
    poses: [],
    isDef: false,
    sector: 0,
  });
};

describe("Pallet groups router integration", () => {
  describe("GET /api/pallet-groups", () => {
    it("401 without auth token", async () => {
      await request(app).get("/api/pallet-groups").expect(401);
    });

    it("403 for USER role", async () => {
      await request(app)
        .get("/api/pallet-groups")
        .set(createAuthHeader(RoleType.USER))
        .expect(403);
    });

    it("200 returns all groups for ADMIN", async () => {
      await PalletGroup.create({ title: "Group A", order: 1, pallets: [] });
      await PalletGroup.create({ title: "Group B", order: 2, pallets: [] });

      const response = await request(app)
        .get("/api/pallet-groups")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe("Pallet groups fetched successfully");
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/pallet-groups/free-pallets", () => {
    it("200 returns free pallets for ADMIN", async () => {
      const palletP1 = await createPallet("P1");
      await createPallet("P2");
      await PalletGroup.create({
        title: "Group 1",
        order: 1,
        pallets: [palletP1._id],
      });

      const response = await request(app)
        .get("/api/pallet-groups/free-pallets")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe("Free pallets fetched successfully");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("P2");
    });
  });

  describe("GET /api/pallet-groups/:id", () => {
    it("200 returns group by id", async () => {
      const group = await PalletGroup.create({
        title: "Group A",
        order: 1,
        pallets: [],
      });

      const response = await request(app)
        .get(`/api/pallet-groups/${group._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.data.title).toBe("Group A");
    });

    it("400 for invalid id", async () => {
      await request(app)
        .get("/api/pallet-groups/invalid-id")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(400);
    });
  });

  describe("POST /api/pallet-groups", () => {
    it("201 creates group for ADMIN", async () => {
      const response = await request(app)
        .post("/api/pallet-groups")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "New Group" })
        .expect(201);

      expect(response.body.message).toBe("Pallet group created successfully");
      expect(response.body.data.title).toBe("New Group");
    });
  });

  describe("PUT /api/pallet-groups/:id", () => {
    it("200 updates group", async () => {
      const group = await PalletGroup.create({
        title: "Old Title",
        order: 1,
        pallets: [],
      });

      const response = await request(app)
        .put(`/api/pallet-groups/${group._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ title: "New Title" })
        .expect(200);

      expect(response.body.data.title).toBe("New Title");
    });
  });

  describe("PATCH /api/pallet-groups/reorder", () => {
    it("200 reorders groups", async () => {
      const g1 = await PalletGroup.create({
        title: "Group A",
        order: 1,
        pallets: [],
      });
      const g2 = await PalletGroup.create({
        title: "Group B",
        order: 2,
        pallets: [],
      });

      const response = await request(app)
        .patch("/api/pallet-groups/reorder")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({
          orders: [
            { id: g1._id.toString(), order: 2 },
            { id: g2._id.toString(), order: 1 },
          ],
        })
        .expect(200);

      expect(response.body.message).toBe(
        "Pallet groups order updated successfully",
      );
      expect(response.body.data.updatedCount).toBe(2);
    });
  });

  describe("DELETE /api/pallet-groups/:id", () => {
    it("403 for ADMIN role", async () => {
      const group = await PalletGroup.create({
        title: "Group A",
        order: 1,
        pallets: [],
      });

      await request(app)
        .delete(`/api/pallet-groups/${group._id.toString()}`)
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(403);
    });

    it("200 deletes group for PRIME", async () => {
      const group = await PalletGroup.create({
        title: "Group A",
        order: 1,
        pallets: [],
      });

      const response = await request(app)
        .delete(`/api/pallet-groups/${group._id.toString()}`)
        .set(createAuthHeader(RoleType.PRIME))
        .expect(200);

      expect(response.body.message).toBe("Pallet group deleted successfully");

      const deleted = await PalletGroup.findById(group._id);
      expect(deleted).toBeNull();
    });
  });

  describe("POST /api/pallet-groups/reset-pallets-sectors", () => {
    it("200 resets all pallet sectors", async () => {
      const rowId = new mongoose.Types.ObjectId();
      await Pallet.create({
        title: "P1",
        row: rowId,
        rowData: { _id: rowId, title: "Row 1" },
        poses: [],
        isDef: false,
        sector: 101,
      });

      const response = await request(app)
        .post("/api/pallet-groups/reset-pallets-sectors")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe("Pallets sectors reset successfully");
      expect(response.body.data.modifiedCount).toBe(1);
    });
  });

  describe("POST /api/pallet-groups/recalculate-pallets-sectors", () => {
    it("200 recalculates pallet sectors", async () => {
      const pallet = await createPallet("P1");
      await PalletGroup.create({
        title: "Group 1",
        order: 1,
        pallets: [pallet._id],
      });

      const response = await request(app)
        .post("/api/pallet-groups/recalculate-pallets-sectors")
        .set(createAuthHeader(RoleType.ADMIN))
        .expect(200);

      expect(response.body.message).toBe(
        "Pallets sectors recalculated successfully",
      );
      expect(response.body.data.groupsProcessed).toBe(1);
    });
  });

  describe("POST /api/pallet-groups/set-pallets", () => {
    it("200 sets pallets for group", async () => {
      const pallet = await createPallet("P1");
      const group = await PalletGroup.create({
        title: "Group A",
        order: 1,
        pallets: [],
      });

      const response = await request(app)
        .post("/api/pallet-groups/set-pallets")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({
          groupId: group._id.toString(),
          palletIds: [pallet._id.toString()],
        })
        .expect(200);

      expect(response.body.message).toBe("Pallets set for group successfully");
      expect(response.body.data.pallets).toHaveLength(1);
    });
  });

  describe("POST /api/pallet-groups/unlink-pallet", () => {
    it("200 unlinks pallet from group", async () => {
      const pallet = await createPallet("P1");
      await PalletGroup.create({
        title: "Group A",
        order: 1,
        pallets: [pallet._id],
      });

      const response = await request(app)
        .post("/api/pallet-groups/unlink-pallet")
        .set(createAuthHeader(RoleType.ADMIN))
        .send({ palletId: pallet._id.toString() })
        .expect(200);

      expect(response.body.message).toBe(
        "Pallet unlinked from group successfully",
      );
      expect(response.body.data.pallets).toHaveLength(0);
    });
  });
});
