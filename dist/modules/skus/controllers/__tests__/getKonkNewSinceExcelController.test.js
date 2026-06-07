import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../get-konk-new-since-excel/utils/getKonkNewSinceExcelUtil.js", () => ({
    getKonkNewSinceExcelUtil: vi.fn(),
}));
import { getKonkNewSinceExcelUtil } from "../get-konk-new-since-excel/utils/getKonkNewSinceExcelUtil.js";
import { getKonkNewSinceExcelController } from "../get-konk-new-since-excel/getKonkNewSinceExcelController.js";
const mockUtil = vi.mocked(getKonkNewSinceExcelUtil);
describe("getKonkNewSinceExcelController", () => {
    let res;
    let sentBody;
    let responseJson;
    let responseStatus;
    let headers;
    beforeEach(() => {
        mockUtil.mockReset();
        sentBody = undefined;
        responseJson = {};
        responseStatus = {};
        headers = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            setHeader(name, value) {
                headers[name] = value;
                return this;
            },
            send(body) {
                sentBody = body;
                return this;
            },
            headersSent: false,
        };
    });
    it("400 when since query missing", async () => {
        const req = {
            params: { konkName: "air" },
            query: {},
        };
        await getKonkNewSinceExcelController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 sends excel buffer", async () => {
        const buffer = Buffer.from("new-since-excel");
        mockUtil.mockResolvedValue({ buffer, fileName: "new-air.xlsx" });
        const req = {
            params: { konkName: "air" },
            query: { since: "2026-04-01" },
        };
        await getKonkNewSinceExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(mockUtil).toHaveBeenCalledWith("air", {
            since: new Date("2026-04-01T00:00:00.000Z"),
        });
        expect(headers["Content-Disposition"]).toContain("new-air.xlsx");
        expect(sentBody).toEqual(buffer);
    });
});
