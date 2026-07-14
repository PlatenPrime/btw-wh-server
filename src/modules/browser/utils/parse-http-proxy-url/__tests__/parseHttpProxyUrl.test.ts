import { describe, expect, it } from "vitest";
import { parseHttpProxyUrl } from "../parseHttpProxyUrl.js";

describe("parseHttpProxyUrl", () => {
  it("парсит http proxy с auth и портом", () => {
    expect(
      parseHttpProxyUrl("http://user:secret@77.47.252.164:50100")
    ).toEqual({
      protocol: "http",
      host: "77.47.252.164",
      port: 50100,
      auth: { username: "user", password: "secret" },
    });
  });

  it("декодирует percent-encoded auth", () => {
    expect(parseHttpProxyUrl("http://u%40ser:p%40ss@10.0.0.1:8080")).toEqual({
      protocol: "http",
      host: "10.0.0.1",
      port: 8080,
      auth: { username: "u@ser", password: "p@ss" },
    });
  });

  it("без auth — без поля auth", () => {
    expect(parseHttpProxyUrl("http://127.0.0.1:3128")).toEqual({
      protocol: "http",
      host: "127.0.0.1",
      port: 3128,
    });
  });

  it("https без порта → 443", () => {
    expect(parseHttpProxyUrl("https://proxy.example")).toEqual({
      protocol: "https",
      host: "proxy.example",
      port: 443,
    });
  });

  it("http без порта → 80", () => {
    expect(parseHttpProxyUrl("http://proxy.example")).toEqual({
      protocol: "http",
      host: "proxy.example",
      port: 80,
    });
  });

  it("пустая строка / пробелы → null", () => {
    expect(parseHttpProxyUrl("")).toBeNull();
    expect(parseHttpProxyUrl("   ")).toBeNull();
  });

  it("невалидный URL → null", () => {
    expect(parseHttpProxyUrl("not-a-url")).toBeNull();
  });

  it("socks → null", () => {
    expect(parseHttpProxyUrl("socks5://user:pass@10.0.0.1:50101")).toBeNull();
  });
});
