import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../../test/utils/testApp.js";
import { clearSharikArtImageCache } from "../utils/cache/getCachedSharikArtImage.js";
vi.mock("../utils/fetch-sharik-art-image/fetchSharikArtImage.js", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        fetchSharikArtImage: vi.fn(),
    };
});
import { fetchSharikArtImage, SharikArtImageNotFoundError, SharikArtImageUpstreamError, } from "../utils/fetch-sharik-art-image/fetchSharikArtImage.js";
describe("Media router integration", () => {
    beforeEach(() => {
        clearSharikArtImageCache();
        vi.mocked(fetchSharikArtImage).mockReset();
    });
    afterEach(() => {
        clearSharikArtImageCache();
    });
    it("200 returns image bytes with cache headers", async () => {
        const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
        vi.mocked(fetchSharikArtImage).mockResolvedValue({
            buffer: jpeg,
            contentType: "image/jpeg",
        });
        const response = await request(app)
            .get("/api/media/sharik/1302-0065")
            .query({ size: "prev" })
            .buffer(true)
            .parse((res, callback) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            res.on("end", () => callback(null, Buffer.concat(chunks)));
        })
            .expect(200);
        expect(response.headers["content-type"]).toMatch(/image\/jpeg/);
        expect(response.headers["cache-control"]).toBe("public, max-age=86400");
        expect(response.headers.etag).toMatch(/^"prev-1302-0065-4-\d+"$/);
        expect(Buffer.isBuffer(response.body)).toBe(true);
        expect(response.body.equals(jpeg)).toBe(true);
        expect(fetchSharikArtImage).toHaveBeenCalledWith("1302-0065", "prev");
    });
    it("304 when If-None-Match matches ETag", async () => {
        const jpeg = Buffer.from("cached-jpeg");
        vi.mocked(fetchSharikArtImage).mockResolvedValue({
            buffer: jpeg,
            contentType: "image/jpeg",
        });
        const first = await request(app)
            .get("/api/media/sharik/1302-0065?size=big")
            .expect(200);
        const etag = first.headers.etag;
        expect(etag).toBeTruthy();
        const second = await request(app)
            .get("/api/media/sharik/1302-0065?size=big")
            .set("If-None-Match", etag)
            .expect(304);
        expect(second.headers.etag).toBe(etag);
        expect(fetchSharikArtImage).toHaveBeenCalledTimes(1);
    });
    it("400 on bad size", async () => {
        const response = await request(app)
            .get("/api/media/sharik/1302-0065")
            .query({ size: "huge" })
            .expect(400);
        expect(response.body.message).toBe("Validation error");
        expect(fetchSharikArtImage).not.toHaveBeenCalled();
    });
    it("400 on invalid artikul with slash encoded", async () => {
        const response = await request(app)
            .get(`/api/media/sharik/${encodeURIComponent("bad/art")}`)
            .expect(400);
        expect(response.body.message).toBe("Validation error");
    });
    it("404 when upstream image missing", async () => {
        vi.mocked(fetchSharikArtImage).mockRejectedValue(new SharikArtImageNotFoundError());
        const response = await request(app)
            .get("/api/media/sharik/missing-art")
            .expect(404);
        expect(response.body).toEqual({ message: "Image not found" });
    });
    it("502 when upstream/proxy fails", async () => {
        vi.mocked(fetchSharikArtImage).mockRejectedValue(new SharikArtImageUpstreamError("timeout"));
        const response = await request(app)
            .get("/api/media/sharik/1302-0065")
            .expect(502);
        expect(response.body).toEqual({ message: "Upstream image fetch failed" });
    });
    it("works without auth token", async () => {
        vi.mocked(fetchSharikArtImage).mockResolvedValue({
            buffer: Buffer.from("x"),
            contentType: "image/jpeg",
        });
        await request(app).get("/api/media/sharik/ART-1").expect(200);
    });
});
