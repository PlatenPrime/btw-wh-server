import { describe, expect, it } from "vitest";
import {
  CLIENT_INGEST_REQUIRED_CODE,
  ServerSkugrFillDisabledError,
} from "../serverSkugrFillDisabledError.js";

describe("ServerSkugrFillDisabledError", () => {
  it("includes konkName and CLIENT_INGEST_REQUIRED code", () => {
    const err = new ServerSkugrFillDisabledError("air");
    expect(err.name).toBe("ServerSkugrFillDisabledError");
    expect(err.code).toBe(CLIENT_INGEST_REQUIRED_CODE);
    expect(err.message).toContain("air");
  });
});
