import { afterEach, describe, expect, it } from "vitest";
import { getAirHttpProxyUrl } from "../getAirHttpProxyUrl.js";

describe("getAirHttpProxyUrl", () => {
  const original = process.env.AIR_HTTP_PROXY_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AIR_HTTP_PROXY_URL;
    } else {
      process.env.AIR_HTTP_PROXY_URL = original;
    }
  });

  it("возвращает trimmed URL из env", () => {
    process.env.AIR_HTTP_PROXY_URL =
      "  http://proshta:secret@77.47.252.164:50100  ";
    expect(getAirHttpProxyUrl()).toBe(
      "http://proshta:secret@77.47.252.164:50100"
    );
  });

  it("undefined когда env пустой или отсутствует", () => {
    delete process.env.AIR_HTTP_PROXY_URL;
    expect(getAirHttpProxyUrl()).toBeUndefined();

    process.env.AIR_HTTP_PROXY_URL = "   ";
    expect(getAirHttpProxyUrl()).toBeUndefined();
  });
});
