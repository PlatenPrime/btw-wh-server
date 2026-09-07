import { describe, expect, it } from "vitest";
import {
  extractBalunCsrfToken,
  getCookieValue,
} from "../extractBalunCsrfToken.js";

describe("getCookieValue", () => {
  it("reads named cookie from Cookie header", () => {
    expect(
      getCookieValue("cid=1; csrf_token_company_site=abc123; evoauth=x", "csrf_token_company_site")
    ).toBe("abc123");
  });

  it("skips malformed cookie segments without equals", () => {
    expect(
      getCookieValue("noidequals; csrf_token_company_site=x", "csrf_token_company_site")
    ).toBe("x");
  });

  it("returns undefined when cookie is missing or empty", () => {
    expect(getCookieValue("cid=1", "csrf_token_company_site")).toBeUndefined();
    expect(getCookieValue("csrf_token_company_site=; cid=1", "csrf_token_company_site")).toBeUndefined();
    expect(getCookieValue("", "csrf_token_company_site")).toBeUndefined();
  });
});

describe("extractBalunCsrfToken", () => {
  it("prefers meta csrf-token over cookie", () => {
    const html = `<meta name="csrf-token" content="from-meta">`;
    expect(
      extractBalunCsrfToken(html, "csrf_token_company_site=from-cookie")
    ).toBe("from-meta");
  });

  it("reads csrf-token meta when content goes first", () => {
    const html = `<meta content="meta-first" name="csrf-token">`;
    expect(extractBalunCsrfToken(html, "")).toBe("meta-first");
  });

  it("reads csrfToken from JSON-like HTML", () => {
    expect(
      extractBalunCsrfToken(`{"csrfToken":"json-token"}`, "")
    ).toBe("json-token");
  });

  it("reads csrf_token from JSON-like HTML", () => {
    expect(
      extractBalunCsrfToken(`window.__STATE__ = { csrf_token: "snake_token" }`, "")
    ).toBe("snake_token");
  });

  it("reads quoted csrf_token key", () => {
    expect(
      extractBalunCsrfToken(`{"csrf_token":"quoted_token"}`, "")
    ).toBe("quoted_token");
  });

  it("falls back to csrf_token_company_site cookie", () => {
    expect(
      extractBalunCsrfToken("<html></html>", "csrf_token_company_site=cookie-token")
    ).toBe("cookie-token");
  });

  it("returns undefined when neither HTML nor cookie has a token", () => {
    expect(extractBalunCsrfToken("<html></html>", "cid=1")).toBeUndefined();
  });
});
