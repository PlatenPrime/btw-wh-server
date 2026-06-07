import { beforeEach, describe, expect, it, vi } from "vitest";
import { Kask } from "../../models/Kask.js";
import { createKaskController } from "../create-kask/createKaskController.js";
vi.mock("../create-kask/utils/sendCreateKaskMesUtil.js", () => ({
    sendCreateKaskMesUtil: vi.fn(),
}));
import { sendCreateKaskMesUtil } from "../create-kask/utils/sendCreateKaskMesUtil.js";
describe("createKaskController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Kask.deleteMany({});
        vi.mocked(sendCreateKaskMesUtil).mockReset();
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
    });
    it("400 when artikul missing", async () => {
        const req = {
            body: { nameukr: "Товар", zone: "A1" },
        };
        await createKaskController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400 when zone missing", async () => {
        const req = {
            body: { artikul: "1234-5678", nameukr: "Товар" },
        };
        await createKaskController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates kask and returns document", async () => {
        const req = {
            body: {
                artikul: "1234-5678",
                nameukr: "Кулька",
                zone: "42-5-1",
                quant: 3,
                com: "Терміново",
            },
            user: { id: "user-1", role: "USER" },
        };
        await createKaskController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.artikul).toBe("1234-5678");
        expect(responseJson.nameukr).toBe("Кулька");
        expect(responseJson.zone).toBe("42-5-1");
        expect(responseJson.quant).toBe(3);
        expect(responseJson.com).toBe("Терміново");
        expect(await Kask.countDocuments()).toBe(1);
        expect(sendCreateKaskMesUtil).toHaveBeenCalledOnce();
    });
    it("201 creates kask without optional fields", async () => {
        const req = {
            body: {
                artikul: "9999-0001",
                nameukr: "Без опцій",
                zone: "B1",
            },
            user: { id: "user-1", role: "USER" },
        };
        await createKaskController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.quant).toBeUndefined();
        expect(responseJson.com).toBeUndefined();
    });
});
