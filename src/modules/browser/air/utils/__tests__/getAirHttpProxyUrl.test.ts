import { afterEach, describe, expect, it } from "vitest";
import {
  AIR_HTTP_PROXY_ENABLED,
  getAirHttpProxyUrl,
} from "../getAirHttpProxyUrl.js";

describe("getAirHttpProxyUrl", () => {
  const original = process.env.AIR_HTTP_PROXY_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AIR_HTTP_PROXY_URL;
    } else {
      process.env.AIR_HTTP_PROXY_URL = original;
    }
  });

  it("AIR_HTTP_PROXY_ENABLED=true — возвращает trimmed URL из env", () => {
    expect(AIR_HTTP_PROXY_ENABLED).toBe(true);
    process.env.AIR_HTTP_PROXY_URL =
      "  http://user:secret@77.47.252.164:50100  ";
    expect(getAirHttpProxyUrl()).toBe(
      "http://user:secret@77.47.252.164:50100"
    );
  });

  it("undefined когда env пустой или отсутствует", () => {
    delete process.env.AIR_HTTP_PROXY_URL;
    expect(getAirHttpProxyUrl()).toBeUndefined();

    process.env.AIR_HTTP_PROXY_URL = "   ";
    expect(getAirHttpProxyUrl()).toBeUndefined();
  });
});
