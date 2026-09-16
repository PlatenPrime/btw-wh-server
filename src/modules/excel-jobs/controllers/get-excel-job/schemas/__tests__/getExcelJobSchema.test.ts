import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import {
  downloadExcelJobFileSchema,
  getExcelJobSchema,
  listExcelJobsSchema,
} from "../getExcelJobSchema.js";

describe("excel job query schemas", () => {
  it("accepts valid object id", () => {
    const parsed = getExcelJobSchema.safeParse({
      id: new mongoose.Types.ObjectId().toString(),
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid object id", () => {
    expect(getExcelJobSchema.safeParse({ id: "bad" }).success).toBe(false);
  });

  it("parses comma status filter", () => {
    const parsed = listExcelJobsSchema.safeParse({ status: "queued,running" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toEqual(["queued", "running"]);
    }
  });

  it("rejects invalid status filter", () => {
    expect(listExcelJobsSchema.safeParse({ status: "nope" }).success).toBe(false);
  });

  it("requires download token", () => {
    expect(
      downloadExcelJobFileSchema.safeParse({
        id: new mongoose.Types.ObjectId().toString(),
      }).success,
    ).toBe(false);
  });
});
