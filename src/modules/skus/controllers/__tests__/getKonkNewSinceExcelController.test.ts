import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../get-konk-new-since-excel/utils/getKonkNewSinceExcelUtil.js", () => ({
  getKonkNewSinceExcelUtil: vi.fn(),
}));

import { getKonkNewSinceExcelUtil } from "../get-konk-new-since-excel/utils/getKonkNewSinceExcelUtil.js";
import { getKonkNewSinceExcelController } from "../get-konk-new-since-excel/getKonkNewSinceExcelController.js";

const mockUtil = vi.mocked(getKonkNewSinceExcelUtil);

describe("getKonkNewSinceExcelController", () => {
  let res: Response;
  let sentBody: Buffer | undefined;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };
  let headers: Record<string, string>;

  beforeEach(() => {
    mockUtil.mockReset();
    sentBody = undefined;
    responseJson = {};
    responseStatus = {};
    headers = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      setHeader(name: string, value: string) {
        headers[name] = value;
        return this;
      },
      send(body: Buffer) {
        sentBody = body;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 when since query missing", async () => {
    const req = {
      params: { konkName: "air" },
      query: {},
    } as unknown as Request;
    await getKonkNewSinceExcelController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 sends excel buffer", async () => {
    const buffer = Buffer.from("new-since-excel");
    mockUtil.mockResolvedValue({ buffer, fileName: "new-air.xlsx" });

    const req = {
      params: { konkName: "air" },
      query: { since: "2026-04-01" },
    } as unknown as Request;

    await getKonkNewSinceExcelController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(mockUtil).toHaveBeenCalledWith("air", {
      since: new Date("2026-04-01T00:00:00.000Z"),
    });
    expect(headers["Content-Disposition"]).toContain("new-air.xlsx");
    expect(sentBody).toEqual(buffer);
  });
});
