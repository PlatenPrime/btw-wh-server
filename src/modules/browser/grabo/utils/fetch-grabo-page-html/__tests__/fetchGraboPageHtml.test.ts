import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPageHtml } from "../../../../utils/fetchPageHtml.js";
import { sleep } from "../../../../utils/sleep.js";
import {
  GRABO_FETCH_MAX_ATTEMPTS,
  GRABO_FETCH_RETRY_WAIT_MS,
  fetchGraboPageHtml,
} from "../fetchGraboPageHtml.js";

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("../../../../../../logging/createLogger.js", () => ({
  createLogger: () => mockLogger,
}));
vi.mock("../../../../utils/fetchPageHtml.js");
vi.mock("../../../../utils/sleep.js", () => ({
  sleep: vi.fn(() => Promise.resolve()),
}));

const URL = "https://www.grabo-balloons.com/en/hearts/page-4";
const TIMEOUT = new Error(
  "Browser GET failed (ETIMEDOUT): https://www.grabo-balloons.com/en/hearts/page-4 — connect ETIMEDOUT 77.89.18.150:443"
);

describe("fetchGraboPageHtml", () => {
  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
    vi.mocked(sleep).mockClear();
    mockLogger.warn.mockClear();
  });

  it("exposes 3 attempts and 8/20/45s waits", () => {
    expect(GRABO_FETCH_MAX_ATTEMPTS).toBe(3);
    expect(GRABO_FETCH_RETRY_WAIT_MS).toEqual([8_000, 20_000, 45_000]);
  });

  it("returns html on first success without sleep", async () => {
    vi.mocked(fetchPageHtml).mockResolvedValue("<html>ok</html>");

    await expect(fetchGraboPageHtml(URL)).resolves.toBe("<html>ok</html>");
    expect(fetchPageHtml).toHaveBeenCalledTimes(1);
    expect(fetchPageHtml).toHaveBeenCalledWith(URL, { konkName: "grabo" });
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries the same url after ETIMEDOUT then succeeds", async () => {
    vi.mocked(fetchPageHtml)
      .mockRejectedValueOnce(TIMEOUT)
      .mockResolvedValueOnce("<html>page-4</html>");

    await expect(fetchGraboPageHtml(URL)).resolves.toBe("<html>page-4</html>");
    expect(fetchPageHtml).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(8_000);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        url: URL,
        attempt: 1,
        maxAttempts: 3,
        waitMs: 8_000,
      }),
      "grabo fetch retry"
    );
  });

  it("throws after three transient failures", async () => {
    vi.mocked(fetchPageHtml).mockRejectedValue(TIMEOUT);

    await expect(fetchGraboPageHtml(URL)).rejects.toThrow(/ETIMEDOUT/);
    expect(fetchPageHtml).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 8_000);
    expect(sleep).toHaveBeenNthCalledWith(2, 20_000);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 3, url: URL }),
      "grabo fetch retry exhausted"
    );
  });

  it("does not retry non-transient errors", async () => {
    vi.mocked(fetchPageHtml).mockRejectedValue(new Error("HTTP 404"));

    await expect(fetchGraboPageHtml(URL)).rejects.toThrow("HTTP 404");
    expect(fetchPageHtml).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
