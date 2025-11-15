import { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi, } from "vitest";
import { getPullsController } from "../get-pulls/getPullsController.js";
import { calculatePullsUtil } from "../get-pulls/utils/calculatePullsUtil.js";
vi.mock("../../utils/calculatePullsUtil.js", async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        calculatePullsUtil: vi.fn(),
    };
});
const mockedCalculatePullsUtil = calculatePullsUtil;
describe("getPullsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
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
    afterEach(() => {
        vi.clearAllMocks();
    });
    it("200: возвращает подготовленный ответ утилиты", async () => {
        const req = {};
        const mockResponse = {
            pulls: [
                {
                    palletId: new Types.ObjectId("6568d4e0550102f4b6b2d001"),
                    palletTitle: "Pallet A",
                    rowTitle: "Row 1",
                    sector: 1,
                    positions: [
                        {
                            posId: new Types.ObjectId("6568d4e0550102f4b6b2d101"),
                            artikul: "ART-1",
                            nameukr: "Товар 1",
                            currentQuant: 50,
                            currentBoxes: 5,
                            plannedQuant: 7,
                            totalRequestedQuant: 10,
                            alreadyPulledQuant: 3,
                            alreadyPulledBoxes: 1,
                            askId: new Types.ObjectId("6568d4e0550102f4b6b2d201"),
                            askerData: {
                                _id: new Types.ObjectId("6568d4e0550102f4b6b2d301"),
                                fullname: "Test User",
                                telegram: "@test_user",
                                photo: "",
                            },
                        },
                    ],
                    totalAsks: 1,
                },
            ],
            totalPulls: 1,
            totalAsks: 1,
        };
        mockedCalculatePullsUtil.mockResolvedValueOnce(mockResponse);
        await getPullsController(req, res);
        expect(mockedCalculatePullsUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.message).toBe("Pulls calculated successfully");
        expect(responseJson.data).toEqual(mockResponse);
    });
    it("500: возвращает ошибку если расчёт падает", async () => {
        const req = {};
        const testError = new Error("DB offline");
        mockedCalculatePullsUtil.mockRejectedValueOnce(testError);
        await getPullsController(req, res);
        expect(mockedCalculatePullsUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Failed to calculate pulls");
        expect(responseJson.error).toBe(testError.message);
    });
});
