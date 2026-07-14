import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { clearCompensatingRunsForTests } from "../utils/compensatingRunStatus.js";

vi.mock("../utils/runCompensatingSlicesForKonk.js", () => ({
  runCompensatingSlicesForKonk: vi.fn(),
}));

import { runCompensatingSlicesForKonk } from "../utils/runCompensatingSlicesForKonk.js";

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

describe("slice-compensation router integration", () => {
  beforeEach(() => {
    clearCompensatingRunsForTests();
    vi.clearAllMocks();
    vi.mocked(runCompensatingSlicesForKonk).mockResolvedValue({
      konkName: "air",
      sliceDate: new Date("2026-07-14T00:00:00.000Z"),
      analog: { refetched: 1, updated: 1 },
      sku: { refetched: 0, updated: 0 },
    });
  });

  afterEach(() => {
    clearCompensatingRunsForTests();
  });

  it("POST /api/slice-compensation/run returns 401 without token", async () => {
    await request(app)
      .post("/api/slice-compensation/run")
      .send({ konkName: "air" })
      .expect(401);
  });

  it("POST /api/slice-compensation/run returns 403 for USER", async () => {
    await request(app)
      .post("/api/slice-compensation/run")
      .set(createAuthHeader(RoleType.USER))
      .send({ konkName: "air" })
      .expect(403);
  });

  it("POST /api/slice-compensation/run returns 400 when body invalid", async () => {
    const response = await request(app)
      .post("/api/slice-compensation/run")
      .set(createAuthHeader())
      .send({})
      .expect(400);

    expect(response.body.message).toBe("Validation error");
  });

  it("POST /api/slice-compensation/run returns 200 for ADMIN", async () => {
    const response = await request(app)
      .post("/api/slice-compensation/run")
      .set(createAuthHeader())
      .send({ konkName: "Air" })
      .expect(200);

    expect(runCompensatingSlicesForKonk).toHaveBeenCalledWith("air");
    expect(response.body).toEqual({
      message: "Compensating slice completed",
      data: {
        konkName: "air",
        sliceDate: "2026-07-14",
        analog: { refetched: 1, updated: 1 },
        sku: { refetched: 0, updated: 0 },
      },
    });
  });
});
