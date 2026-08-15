import { describe, expect, it } from "vitest";
import { isGraboTransientFetchError } from "../isGraboTransientFetchError.js";

describe("isGraboTransientFetchError", () => {
  it("detects ETIMEDOUT code and formatted browser message", () => {
    expect(
      isGraboTransientFetchError(
        Object.assign(new Error("connect failed"), { code: "ETIMEDOUT" })
      )
    ).toBe(true);
    expect(
      isGraboTransientFetchError(
        new Error(
          "Browser GET failed (ETIMEDOUT): https://www.grabo-balloons.com/en/x — connect ETIMEDOUT 77.89.18.150:443"
        )
      )
    ).toBe(true);
  });

  it("detects ECONNRESET, ECONNREFUSED, EPIPE, EAI_AGAIN, socket hang up, timeout", () => {
    expect(
      isGraboTransientFetchError(
        Object.assign(new Error("reset"), { code: "ECONNRESET" })
      )
    ).toBe(true);
    expect(
      isGraboTransientFetchError(
        Object.assign(new Error("refused"), { code: "ECONNREFUSED" })
      )
    ).toBe(true);
    expect(
      isGraboTransientFetchError(
        Object.assign(new Error("pipe"), { code: "EPIPE" })
      )
    ).toBe(true);
    expect(
      isGraboTransientFetchError(
        Object.assign(new Error("dns"), { code: "EAI_AGAIN" })
      )
    ).toBe(true);
    expect(
      isGraboTransientFetchError(new Error("socket hang up"))
    ).toBe(true);
    expect(
      isGraboTransientFetchError(
        new Error("Browser GET timeout (30000ms): https://example.com")
      )
    ).toBe(true);
  });

  it("walks error.cause", () => {
    const cause = Object.assign(new Error("connect"), { code: "ETIMEDOUT" });
    expect(isGraboTransientFetchError(new Error("wrapper", { cause }))).toBe(
      true
    );
  });

  it("rejects non-transient errors", () => {
    expect(isGraboTransientFetchError(new Error("HTTP 404"))).toBe(false);
    expect(isGraboTransientFetchError(new Error("Network error"))).toBe(false);
    expect(isGraboTransientFetchError("nope")).toBe(false);
  });
});
