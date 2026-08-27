import { describe, expect, it } from "vitest";
import {
  BrowserOriginBlockedError,
  CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MAX,
  CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MIN,
  isCloudflareOriginBlockedStatus,
  isOriginBlockedError,
  ORIGIN_BLOCKED_CODE,
  parseRetryAfterSeconds,
} from "../browserOriginBlockedError.js";

describe("isCloudflareOriginBlockedStatus", () => {
  it("true for 520–526 inclusive", () => {
    expect(isCloudflareOriginBlockedStatus(519)).toBe(false);
    expect(isCloudflareOriginBlockedStatus(520)).toBe(true);
    expect(isCloudflareOriginBlockedStatus(523)).toBe(true);
    expect(isCloudflareOriginBlockedStatus(526)).toBe(true);
    expect(isCloudflareOriginBlockedStatus(527)).toBe(false);
    expect(CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MIN).toBe(520);
    expect(CLOUDFLARE_ORIGIN_BLOCKED_STATUS_MAX).toBe(526);
  });
});

describe("parseRetryAfterSeconds", () => {
  it("parses integer seconds", () => {
    expect(parseRetryAfterSeconds("60")).toBe(60);
    expect(parseRetryAfterSeconds("  5  ")).toBe(5);
  });

  it("undefined for empty, HTTP-date, or non-integer", () => {
    expect(parseRetryAfterSeconds(undefined)).toBeUndefined();
    expect(parseRetryAfterSeconds("")).toBeUndefined();
    expect(parseRetryAfterSeconds("Wed, 21 Oct 2015 07:28:00 GMT")).toBeUndefined();
    expect(parseRetryAfterSeconds("60.5")).toBeUndefined();
  });
});

describe("isOriginBlockedError", () => {
  it("true for BrowserOriginBlockedError and duck-typed code", () => {
    const typed = new BrowserOriginBlockedError("blocked", {
      httpStatus: 520,
      retryAfterSec: 60,
    });
    expect(typed.code).toBe(ORIGIN_BLOCKED_CODE);
    expect(typed.httpStatus).toBe(520);
    expect(typed.retryAfterSec).toBe(60);
    expect(isOriginBlockedError(typed)).toBe(true);

    const duck = Object.assign(new Error("x"), { code: ORIGIN_BLOCKED_CODE });
    expect(isOriginBlockedError(duck)).toBe(true);
  });

  it("false for ordinary errors", () => {
    expect(isOriginBlockedError(new Error("network"))).toBe(false);
    expect(isOriginBlockedError("520")).toBe(false);
    expect(isOriginBlockedError(null)).toBe(false);
  });
});
