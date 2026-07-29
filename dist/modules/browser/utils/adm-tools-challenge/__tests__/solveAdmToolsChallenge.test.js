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
const SAMPLE_CHALLENGE_HTML = `<!DOCTYPE html>
<title>Захищена сторінка</title>
<a href="https://adm.tools">adm.tools</a>
<script>
form.append('___ack', eval('6-27+26+56'));
</script>`;
describe("solveAdmToolsChallenge", () => {
    beforeEach(() => {
        mockInfo.mockClear();
    });
    it("POST FormData ___ack=61 и ждёт 200", async () => {
        const fetch = vi.fn(async (_url, init) => {
            expect(init?.method).toBe("POST");
            expect(init?.body).toBeInstanceOf(FormData);
            expect((init?.body).get("___ack")).toBe("61");
            return { status: 200, text: async () => "ok" };
        });
        const client = { fetch };
        const result = await solveAdmToolsChallenge(client, "https://airballoons.com.ua/ua/product/x", SAMPLE_CHALLENGE_HTML);
        expect(result).toEqual({ ack: 61, postStatus: 200 });
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(mockInfo).toHaveBeenCalled();
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
        await expect(solveAdmToolsChallenge(client, "https://example.com/p", SAMPLE_CHALLENGE_HTML)).rejects.toThrow(/___ack POST HTTP 403/);
    });
});
