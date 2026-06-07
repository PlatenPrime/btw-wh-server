import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../get-konk-invalid-excel/utils/getKonkInvalidExcelUtil.js", () => ({
    getKonkInvalidExcelUtil: vi.fn(),
}));
import { getKonkInvalidExcelUtil } from "../get-konk-invalid-excel/utils/getKonkInvalidExcelUtil.js";
import { getKonkInvalidExcelController } from "../get-konk-invalid-excel/getKonkInvalidExcelController.js";
const mockUtil = vi.mocked(getKonkInvalidExcelUtil);
describe("getKonkInvalidExcelController", () => {
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
    it("400 when konkName invalid", async () => {
        const req = { params: { konkName: "" } };
        await getKonkInvalidExcelController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 sends excel buffer", async () => {
        const buffer = Buffer.from("excel-data");
        mockUtil.mockResolvedValue({ buffer, fileName: "invalid-air.xlsx" });
        const req = { params: { konkName: "air" } };
        await getKonkInvalidExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(headers["Content-Type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(headers["Content-Disposition"]).toContain("invalid-air.xlsx");
        expect(sentBody).toEqual(buffer);
    });
});
