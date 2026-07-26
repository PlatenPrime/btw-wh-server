import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpsProxyAgent } from "https-proxy-agent";

const mockGet = vi.hoisted(() => vi.fn());
const mockSleep = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("../../../../utils/browserRequest.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../utils/browserRequest.js")
    >();
  return {
    ...actual,
    getBrowserAxios: () => ({ get: mockGet }),
  };
});

vi.mock("../../../../utils/sleep.js", () => ({
  sleep: mockSleep,
}));

import {
  AIR_PRODUCT_FETCH_RETRY_DELAYS_MS,
  fetchAirProductHtml,
  resolveAirProxyAgents,
  resolveAirProductOrigin,
  resolveRetryAfterMs,
} from "../fetchAirProductHtml.js";

describe("resolveRetryAfterMs", () => {
  it("парсит секунды в ms", () => {
    expect(resolveRetryAfterMs("3")).toBe(3000);
    expect(resolveRetryAfterMs(2)).toBe(2000);
  });

  it("капает на 60s", () => {
    expect(resolveRetryAfterMs("120")).toBe(60_000);
  });

  it("возвращает undefined для мусора и HTTP-date", () => {
    expect(resolveRetryAfterMs(undefined)).toBeUndefined();
    expect(resolveRetryAfterMs("Wed, 21 Oct 2015 07:28:00 GMT")).toBeUndefined();
    expect(resolveRetryAfterMs(-1)).toBeUndefined();
  });
});

describe("resolveAirProductOrigin", () => {
  it("берёт origin из product URL", () => {
    expect(
      resolveAirProductOrigin(
        "https://airballoons.com.ua/ua/product/shar-assorti"
      )
    ).toBe("https://airballoons.com.ua");
  });
});

describe("resolveAirProxyAgents", () => {
  const original = process.env.AIR_HTTP_PROXY_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.AIR_HTTP_PROXY_URL;
    } else {
      process.env.AIR_HTTP_PROXY_URL = original;
    }
  });

  it("undefined когда env нет", () => {
    delete process.env.AIR_HTTP_PROXY_URL;
    expect(resolveAirProxyAgents()).toBeUndefined();
  });

  it("отдаёт HttpsProxyAgent при AIR_HTTP_PROXY_URL", () => {
    process.env.AIR_HTTP_PROXY_URL =
      "http://user:secret@77.47.252.164:50100";
    const agents = resolveAirProxyAgents();
    expect(agents?.httpAgent).toBeInstanceOf(HttpsProxyAgent);
    expect(agents?.httpsAgent).toBeInstanceOf(HttpsProxyAgent);
  });

  it("бросает при невалидном proxy URL", () => {
    process.env.AIR_HTTP_PROXY_URL = "socks5://user:pass@10.0.0.1:50101";
    expect(() => resolveAirProxyAgents()).toThrow(
      /Invalid browser HTTP proxy URL/
    );
  });
});

describe("fetchAirProductHtml", () => {
  const PRODUCT =
    "https://airballoons.com.ua/ua/product/shar-assorti-neonovyj-10-26sm";
  const ORIGIN = "https://airballoons.com.ua/";
  const originalProxy = process.env.AIR_HTTP_PROXY_URL;

  beforeEach(() => {
    mockGet.mockReset();
    mockSleep.mockClear();
    delete process.env.AIR_HTTP_PROXY_URL;
  });

  afterEach(() => {
    if (originalProxy === undefined) {
      delete process.env.AIR_HTTP_PROXY_URL;
    } else {
      process.env.AIR_HTTP_PROXY_URL = originalProxy;
    }
  });

  it("бросает при пустом url", async () => {
    await expect(fetchAirProductHtml("")).rejects.toThrow(
      "Product URL is required and must be a string"
    );
    await expect(fetchAirProductHtml("   ")).rejects.toThrow(
      "Product URL is required and must be a string"
    );
  });

  it("бросает при невалидном url", async () => {
    await expect(fetchAirProductHtml("not-a-url")).rejects.toThrow(
      /Invalid air product URL/
    );
  });

  it("бросает до запросов при невалидном proxy URL", async () => {
    process.env.AIR_HTTP_PROXY_URL = "socks5://user:pass@10.0.0.1:50101";
    await expect(fetchAirProductHtml(PRODUCT)).rejects.toThrow(
      /Invalid browser HTTP proxy URL/
    );
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("warm-up → product с Cookie и Referer", async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "<html>home</html>",
        headers: { "set-cookie": ["PHPSESSID=abc; path=/"] },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: "<html>product</html>",
        headers: {},
      });

    const html = await fetchAirProductHtml(PRODUCT);

    expect(html).toBe("<html>product</html>");
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet.mock.calls[0][0]).toBe(ORIGIN);
    expect(mockGet.mock.calls[1][0]).toBe(PRODUCT);
    expect(mockGet.mock.calls[1][1].headers).toMatchObject({
      Cookie: "PHPSESSID=abc",
      Referer: ORIGIN,
      "Sec-Fetch-Site": "same-origin",
    });
    expect(mockGet.mock.calls[1][1].headers["User-Agent"]).toContain(
      "Chrome/131"
    );
    expect(mockGet.mock.calls[0][1].proxy).toBe(false);
    expect(mockGet.mock.calls[1][1].proxy).toBe(false);
    expect(mockGet.mock.calls[0][1].httpsAgent).toBeUndefined();
    expect(mockSleep).not.toHaveBeenCalled();
  });

  it("передаёт httpsAgent на warm-up и product при AIR_HTTP_PROXY_URL", async () => {
    process.env.AIR_HTTP_PROXY_URL =
      "http://user:secret@77.47.252.164:50100";
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "home",
        headers: { "set-cookie": ["sid=1"] },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: "<html>ok</html>",
        headers: {},
      });

    await fetchAirProductHtml(PRODUCT);

    expect(mockGet.mock.calls[0][1].proxy).toBe(false);
    expect(mockGet.mock.calls[0][1].httpsAgent).toBeInstanceOf(HttpsProxyAgent);
    expect(mockGet.mock.calls[0][1].httpAgent).toBeInstanceOf(HttpsProxyAgent);
    expect(mockGet.mock.calls[1][1].httpsAgent).toBeInstanceOf(HttpsProxyAgent);
  });

  it("при 429 ретраит и возвращает HTML после успеха", async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "home",
        headers: { "set-cookie": ["sid=1; path=/"] },
      })
      .mockResolvedValueOnce({
        status: 429,
        data: "rate",
        headers: { "retry-after": "1" },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: "<html>ok</html>",
        headers: {},
      });

    const html = await fetchAirProductHtml(PRODUCT);

    expect(html).toBe("<html>ok</html>");
    expect(mockGet).toHaveBeenCalledTimes(3);
    expect(mockSleep).toHaveBeenCalledWith(1000);
  });

  it("при 429 без Retry-After использует fallback delay", async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "home",
        headers: { "set-cookie": ["sid=1"] },
      })
      .mockResolvedValueOnce({
        status: 429,
        data: "",
        headers: {},
      })
      .mockResolvedValueOnce({
        status: 200,
        data: "<html>ok</html>",
        headers: {},
      });

    await fetchAirProductHtml(PRODUCT);

    expect(mockSleep).toHaveBeenCalledWith(
      AIR_PRODUCT_FETCH_RETRY_DELAYS_MS[0]
    );
  });

  it("после трёх 429 бросает HTTP 429", async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "home",
        headers: { "set-cookie": ["sid=1"] },
      })
      .mockResolvedValueOnce({ status: 429, data: "", headers: {} })
      .mockResolvedValueOnce({ status: 429, data: "", headers: {} })
      .mockResolvedValueOnce({ status: 429, data: "", headers: {} });

    await expect(fetchAirProductHtml(PRODUCT)).rejects.toThrow(
      `Browser GET HTTP 429: ${PRODUCT}`
    );
    expect(mockSleep).toHaveBeenCalledTimes(2);
    expect(mockSleep).toHaveBeenNthCalledWith(
      1,
      AIR_PRODUCT_FETCH_RETRY_DELAYS_MS[0]
    );
    expect(mockSleep).toHaveBeenNthCalledWith(
      2,
      AIR_PRODUCT_FETCH_RETRY_DELAYS_MS[1]
    );
  });

  it("на retry без cookies повторяет warm-up", async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "home",
        headers: {},
      })
      .mockResolvedValueOnce({
        status: 429,
        data: "",
        headers: {},
      })
      .mockResolvedValueOnce({
        status: 200,
        data: "home2",
        headers: { "set-cookie": ["sid=2"] },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: "<html>ok</html>",
        headers: {},
      });

    const html = await fetchAirProductHtml(PRODUCT);

    expect(html).toBe("<html>ok</html>");
    expect(mockGet.mock.calls[0][0]).toBe(ORIGIN);
    expect(mockGet.mock.calls[1][0]).toBe(PRODUCT);
    expect(mockGet.mock.calls[2][0]).toBe(ORIGIN);
    expect(mockGet.mock.calls[3][0]).toBe(PRODUCT);
    expect(mockGet.mock.calls[3][1].headers.Cookie).toBe("sid=2");
  });

  it("бросает при пустом body на 200", async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "home",
        headers: { "set-cookie": ["sid=1"] },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: "   ",
        headers: {},
      });

    await expect(fetchAirProductHtml(PRODUCT)).rejects.toThrow(
      `Browser GET empty body: ${PRODUCT}`
    );
  });

  it("сразу бросает на non-429 ошибке", async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: "home",
        headers: { "set-cookie": ["sid=1"] },
      })
      .mockResolvedValueOnce({
        status: 503,
        data: "",
        headers: {},
      });

    await expect(fetchAirProductHtml(PRODUCT)).rejects.toThrow(
      `Browser GET HTTP 503: ${PRODUCT}`
    );
    expect(mockSleep).not.toHaveBeenCalled();
  });
});
