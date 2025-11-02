import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { getPalletByTitleController } from "../get-pallet-by-title/getPalletByTitleController.js";

describe("getPalletByTitleController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("200: возвращает exists=true и данные при наличии паллеты", async () => {
    const pallet = await createTestPallet({ title: "Pallet-Test" });
    const req = {
      params: { title: "Pallet-Test" },
    } as unknown as Request;

    await getPalletByTitleController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Pallet retrieved successfully");
    expect(responseJson.data.title).toBe("Pallet-Test");
  });

  it("200: возвращает exists=false при отсутствии паллеты", async () => {
    const req = {
      params: { title: "NonExistent-Pallet" },
    } as unknown as Request;

    await getPalletByTitleController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Pallet not found");
    expect(responseJson.data).toBeNull();
  });
});





