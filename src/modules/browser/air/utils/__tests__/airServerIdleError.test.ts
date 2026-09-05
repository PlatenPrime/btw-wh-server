import { describe, expect, it } from "vitest";
import {
  AIR_SERVER_IDLE_CODE,
  AirServerIdleError,
} from "../airServerIdleError.js";

describe("AirServerIdleError", () => {
  it("exposes code and default message", () => {
    const err = new AirServerIdleError();
    expect(err.name).toBe("AirServerIdleError");
    expect(err.code).toBe(AIR_SERVER_IDLE_CODE);
    expect(err.message).toMatch(/idle/);
  });
});
