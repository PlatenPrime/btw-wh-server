import { describe, expect, it } from "vitest";
import { HttpsProxyAgent } from "https-proxy-agent";
import { createHttpsProxyAgent } from "../createHttpsProxyAgent.js";

describe("createHttpsProxyAgent", () => {
  it("создаёт HttpsProxyAgent для http proxy URL", () => {
    const agent = createHttpsProxyAgent(
      "http://user:secret@77.47.252.164:50100"
    );
    expect(agent).toBeInstanceOf(HttpsProxyAgent);
  });

  it("null для пустой строки", () => {
    expect(createHttpsProxyAgent("")).toBeNull();
    expect(createHttpsProxyAgent("   ")).toBeNull();
  });

  it("null для SOCKS и мусора", () => {
    expect(
      createHttpsProxyAgent("socks5://user:pass@10.0.0.1:50101")
    ).toBeNull();
    expect(createHttpsProxyAgent("not-a-url")).toBeNull();
  });
});
