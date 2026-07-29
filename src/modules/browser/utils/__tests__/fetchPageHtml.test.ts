import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../browserRequest.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../browserRequest.js")>();
  return {
    ...actual,
    browserGet: vi.fn(),
  };
});

vi.mock("../playwrightGet.js", () => ({
  playwrightGet: vi.fn(),
}));

vi.mock("../impitGet.js", () => ({
  impitGet: vi.fn(),
}));

import { browserGet } from "../browserRequest.js";
import { fetchPageHtml } from "../fetchPageHtml.js";
import { impitGet } from "../impitGet.js";
import { playwrightGet } from "../playwrightGet.js";

describe("fetchPageHtml", () => {
  const original = process.env.BROWSER_TRANSPORT_BY_KONK;

  beforeEach(() => {
    delete process.env.BROWSER_TRANSPORT_BY_KONK;
    vi.mocked(browserGet).mockReset();
    vi.mocked(playwrightGet).mockReset();
    vi.mocked(impitGet).mockReset();
    vi.mocked(browserGet).mockResolvedValue("<html>http</html>");
    vi.mocked(playwrightGet).mockResolvedValue("<html>pw</html>");
    vi.mocked(impitGet).mockResolvedValue("<html>impit</html>");
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.BROWSER_TRANSPORT_BY_KONK;
    } else {
      process.env.BROWSER_TRANSPORT_BY_KONK = original;
    }
  });

  it("по умолчанию — http / browserGet", async () => {
    const html = await fetchPageHtml("https://example.com");
    expect(html).toBe("<html>http</html>");
    expect(browserGet).toHaveBeenCalledWith("https://example.com", {
      proxyUrl: undefined,
    });
    expect(playwrightGet).not.toHaveBeenCalled();
  });

  it("explicit transport playwright сильнее env http", async () => {
    process.env.BROWSER_TRANSPORT_BY_KONK = "air:http";
    const html = await fetchPageHtml("https://example.com", {
      konkName: "air",
      transport: "playwright",
    });
    expect(html).toBe("<html>pw</html>");
    expect(playwrightGet).toHaveBeenCalledWith("https://example.com", {
      proxyUrl: undefined,
      waitUntil: undefined,
      warmUpUrl: undefined,
    });
    expect(browserGet).not.toHaveBeenCalled();
  });

  it("env + konkName → playwright", async () => {
    process.env.BROWSER_TRANSPORT_BY_KONK = "air:playwright";
    await fetchPageHtml("https://example.com/a", {
      konkName: "air",
      proxyUrl: "http://proxy:1",
      waitUntil: "networkidle",
      warmUpUrl: "https://example.com/",
    });
    expect(playwrightGet).toHaveBeenCalledWith("https://example.com/a", {
      proxyUrl: "http://proxy:1",
      waitUntil: "networkidle",
      warmUpUrl: "https://example.com/",
    });
  });

  it("env + неизвестный konk → http", async () => {
    process.env.BROWSER_TRANSPORT_BY_KONK = "air:playwright";
    await fetchPageHtml("https://example.com", { konkName: "balun" });
    expect(browserGet).toHaveBeenCalled();
    expect(playwrightGet).not.toHaveBeenCalled();
  });

  it("explicit http при env playwright", async () => {
    process.env.BROWSER_TRANSPORT_BY_KONK = "air:playwright";
    await fetchPageHtml("https://example.com", {
      konkName: "air",
      transport: "http",
      proxyUrl: "http://p",
    });
    expect(browserGet).toHaveBeenCalledWith("https://example.com", {
      proxyUrl: "http://p",
    });
    expect(playwrightGet).not.toHaveBeenCalled();
  });

  it("explicit transport impit", async () => {
    const html = await fetchPageHtml("https://example.com/a", {
      transport: "impit",
      proxyUrl: "http://proxy:1",
      warmUpUrl: "https://example.com/",
    });
    expect(html).toBe("<html>impit</html>");
    expect(impitGet).toHaveBeenCalledWith("https://example.com/a", {
      proxyUrl: "http://proxy:1",
      warmUpUrl: "https://example.com/",
      headers: undefined,
    });
    expect(browserGet).not.toHaveBeenCalled();
    expect(playwrightGet).not.toHaveBeenCalled();
  });

  it("env + konkName → impit", async () => {
    process.env.BROWSER_TRANSPORT_BY_KONK = "air:impit";
    await fetchPageHtml("https://example.com", { konkName: "air" });
    expect(impitGet).toHaveBeenCalledWith("https://example.com", {
      proxyUrl: undefined,
      warmUpUrl: undefined,
      headers: undefined,
    });
  });

  it("пробрасывает headers в impitGet", async () => {
    await fetchPageHtml("https://example.com/p", {
      transport: "impit",
      warmUpUrl: "https://example.com/",
      headers: {
        Referer: "https://example.com/",
        "Sec-Fetch-Site": "same-origin",
      },
    });
    expect(impitGet).toHaveBeenCalledWith("https://example.com/p", {
      proxyUrl: undefined,
      warmUpUrl: "https://example.com/",
      headers: {
        Referer: "https://example.com/",
        "Sec-Fetch-Site": "same-origin",
      },
    });
  });
});
