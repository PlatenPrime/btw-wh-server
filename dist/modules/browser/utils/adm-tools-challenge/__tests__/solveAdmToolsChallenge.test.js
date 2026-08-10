import { beforeEach, describe, expect, it, vi } from "vitest";
const mockInfo = vi.hoisted(() => vi.fn());
vi.mock("../../../../../logging/createLogger.js", () => ({
    createLogger: () => ({
        warn: vi.fn(),
        error: vi.fn(),
        info: mockInfo,
        debug: vi.fn(),
    }),
}));
import { solveAdmToolsChallenge } from "../solveAdmToolsChallenge.js";
const SAMPLE_FORM_CHALLENGE_HTML = `<!DOCTYPE html>
<title>Захищена сторінка</title>
<a href="https://adm.tools">adm.tools</a>
<script>
form.append('___ack', eval('6-27+26+56'));
</script>`;
const SAMPLE_JSON_CHALLENGE_HTML = `<!DOCTYPE html>
<title>Захищена сторінка</title>
<a href="https://adm.tools">adm.tools</a>
<script>
xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
xhr.send(JSON.stringify({__ack: eval('10-93-92+33')}));
</script>`;
describe("solveAdmToolsChallenge", () => {
    beforeEach(() => {
        mockInfo.mockClear();
    });
    it("POST FormData ___ack=61 и ждёт 200 (legacy)", async () => {
        const fetch = vi.fn(async (_url, init) => {
            expect(init?.method).toBe("POST");
            expect(init?.body).toBeInstanceOf(FormData);
            expect((init?.body).get("___ack")).toBe("61");
            return { status: 200, text: async () => "ok" };
        });
        const client = { fetch };
        const result = await solveAdmToolsChallenge(client, "https://airballoons.com.ua/ua/product/x", SAMPLE_FORM_CHALLENGE_HTML);
        expect(result).toEqual({
            ack: 61,
            postStatus: 200,
            protocol: "form-___ack",
        });
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(mockInfo).toHaveBeenCalled();
    });
    it("POST JSON __ack=-142 и Content-Type application/json", async () => {
        const fetch = vi.fn(async (_url, init) => {
            expect(init?.method).toBe("POST");
            expect(typeof init?.body).toBe("string");
            expect(init?.body).toBe(JSON.stringify({ __ack: -142 }));
            expect(init?.headers?.["Content-Type"]).toBe("application/json; charset=UTF-8");
            return { status: 200, text: async () => "ok" };
        });
        const client = { fetch };
        const result = await solveAdmToolsChallenge(client, "https://airballoons.com.ua/ua/product/x", SAMPLE_JSON_CHALLENGE_HTML);
        expect(result).toEqual({
            ack: -142,
            postStatus: 200,
            protocol: "json-__ack",
        });
        expect(fetch).toHaveBeenCalledTimes(1);
    });
    it("кидает если не challenge HTML", async () => {
        const client = { fetch: vi.fn() };
        await expect(solveAdmToolsChallenge(client, "https://x", "<html>nope</html>")).rejects.toThrow(/Not an adm.tools challenge/);
    });
    it("кидает если POST не 200", async () => {
        const client = {
            fetch: vi.fn(async () => ({
                status: 403,
                text: async () => "no",
            })),
        };
        await expect(solveAdmToolsChallenge(client, "https://example.com/p", SAMPLE_FORM_CHALLENGE_HTML)).rejects.toThrow(/form-___ack POST HTTP 403/);
    });
});
