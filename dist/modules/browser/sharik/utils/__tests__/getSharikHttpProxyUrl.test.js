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
    it("SHARIK_HTTP_PROXY_ENABLED=true — возвращает trimmed URL из env", () => {
        expect(SHARIK_HTTP_PROXY_ENABLED).toBe(true);
        process.env.SHARIK_HTTP_PROXY_URL =
            "  http://user:secret@77.47.252.164:50100  ";
        expect(getSharikHttpProxyUrl()).toBe("http://user:secret@77.47.252.164:50100");
    });
    it("undefined когда env пустой или отсутствует", () => {
        delete process.env.SHARIK_HTTP_PROXY_URL;
        expect(getSharikHttpProxyUrl()).toBeUndefined();
        process.env.SHARIK_HTTP_PROXY_URL = "   ";
        expect(getSharikHttpProxyUrl()).toBeUndefined();
    });
});
