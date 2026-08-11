import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../../browser/utils/browserRequest.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        browserGetBuffer: vi.fn(),
    };
});
vi.mock("../../../../browser/sharik/utils/getSharikHttpProxyUrl.js", () => ({
    getSharikHttpProxyUrl: vi.fn(() => "http://user:pass@proxy.example:50100"),
}));
import { browserGetBuffer } from "../../../../browser/utils/browserRequest.js";
import { getSharikHttpProxyUrl } from "../../../../browser/sharik/utils/getSharikHttpProxyUrl.js";
import { fetchSharikArtImage, SharikArtImageNotFoundError, SharikArtImageUpstreamError, } from "../fetchSharikArtImage.js";
describe("fetchSharikArtImage", () => {
    beforeEach(() => {
        vi.mocked(browserGetBuffer).mockReset();
        vi.mocked(getSharikHttpProxyUrl).mockReturnValue("http://user:pass@proxy.example:50100");
    });
    it("возвращает buffer при 200 image/jpeg", async () => {
        const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
        vi.mocked(browserGetBuffer).mockResolvedValue({
            status: 200,
            contentType: "image/jpeg",
            buffer,
        });
        const result = await fetchSharikArtImage("1302-0065", "prev");
        expect(result).toEqual({ buffer, contentType: "image/jpeg" });
        expect(browserGetBuffer).toHaveBeenCalledWith("https://sharik.ua/images/elements_big_prev/prev_1302-0065_m1.jpg", { proxyUrl: "http://user:pass@proxy.example:50100" });
    });
    it("NotFound при пустом теле", async () => {
        vi.mocked(browserGetBuffer).mockResolvedValue({
            status: 200,
            contentType: "image/jpeg",
            buffer: Buffer.alloc(0),
        });
        await expect(fetchSharikArtImage("1302-0065", "big")).rejects.toBeInstanceOf(SharikArtImageNotFoundError);
    });
    it("NotFound при non-image Content-Type", async () => {
        vi.mocked(browserGetBuffer).mockResolvedValue({
            status: 200,
            contentType: "text/html",
            buffer: Buffer.from("<html>block</html>"),
        });
        await expect(fetchSharikArtImage("1302-0065", "prev")).rejects.toBeInstanceOf(SharikArtImageNotFoundError);
    });
    it("NotFound при HTTP 404", async () => {
        vi.mocked(browserGetBuffer).mockResolvedValue({
            status: 404,
            contentType: "text/html",
            buffer: Buffer.from("missing"),
        });
        await expect(fetchSharikArtImage("missing", "prev")).rejects.toBeInstanceOf(SharikArtImageNotFoundError);
    });
    it("UpstreamError при HTTP 502", async () => {
        vi.mocked(browserGetBuffer).mockResolvedValue({
            status: 502,
            contentType: "text/plain",
            buffer: Buffer.from("bad gateway"),
        });
        await expect(fetchSharikArtImage("1302-0065", "prev")).rejects.toBeInstanceOf(SharikArtImageUpstreamError);
    });
    it("UpstreamError при сетевой ошибке browserGetBuffer", async () => {
        vi.mocked(browserGetBuffer).mockRejectedValue(new Error("Browser GET timeout (30000ms): https://sharik.ua/x.jpg"));
        await expect(fetchSharikArtImage("1302-0065", "prev")).rejects.toBeInstanceOf(SharikArtImageUpstreamError);
    });
});
