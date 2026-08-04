import { afterEach, describe, expect, it } from "vitest";
import { SHARIK_HTTP_PROXY_ENABLED, getSharikHttpProxyUrl, } from "../getSharikHttpProxyUrl.js";
describe("getSharikHttpProxyUrl", () => {
    const original = process.env.SHARIK_HTTP_PROXY_URL;
    afterEach(() => {
        if (original === undefined) {
            delete process.env.SHARIK_HTTP_PROXY_URL;
        }
        else {
            process.env.SHARIK_HTTP_PROXY_URL = original;
        }
    });
    it("SHARIK_HTTP_PROXY_ENABLED=false — всегда undefined даже при env", () => {
        expect(SHARIK_HTTP_PROXY_ENABLED).toBe(false);
        process.env.SHARIK_HTTP_PROXY_URL =
            "  http://user:secret@77.47.252.164:50100  ";
        expect(getSharikHttpProxyUrl()).toBeUndefined();
    });
    it("undefined когда env пустой или отсутствует", () => {
        delete process.env.SHARIK_HTTP_PROXY_URL;
        expect(getSharikHttpProxyUrl()).toBeUndefined();
        process.env.SHARIK_HTTP_PROXY_URL = "   ";
        expect(getSharikHttpProxyUrl()).toBeUndefined();
    });
});
