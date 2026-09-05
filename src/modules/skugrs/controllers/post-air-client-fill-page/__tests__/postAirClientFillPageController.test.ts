import { beforeEach, describe, expect, it, vi } from "vitest";
import { postAirClientFillPageController } from "../postAirClientFillPageController.js";

vi.mock("../utils/postAirClientFillPageUtil.js", () => ({
  postAirClientFillPageUtil: vi.fn(),
}));

import { postAirClientFillPageUtil } from "../utils/postAirClientFillPageUtil.js";

const id = "507f1f77bcf86cd799439011";
const body = {
  sourceUrl:
    "https://airballoons.com.ua/ua/index.php?route=product/category&path=1",
  pageUrl:
    "https://airballoons.com.ua/ua/index.php?route=product/category&path=1",
  html: "<html>ok</html>",
};

describe("postAirClientFillPageController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("400 on validation error", async () => {
    const req = { params: { id: "bad" }, body: {} } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await postAirClientFillPageController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(postAirClientFillPageUtil).not.toHaveBeenCalled();
  });

  it("404 when util reports SKUGR_NOT_FOUND", async () => {
    vi.mocked(postAirClientFillPageUtil).mockResolvedValue({
      ok: false,
      code: "SKUGR_NOT_FOUND",
      message: "Skugr not found",
    });
    const req = { params: { id }, body } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await postAirClientFillPageController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("422 when util reports PARSE_FAILED", async () => {
    vi.mocked(postAirClientFillPageUtil).mockResolvedValue({
      ok: false,
      code: "PARSE_FAILED",
      message: "HTML did not contain an Air listing",
    });
    const req = { params: { id }, body } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await postAirClientFillPageController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("400 when util reports NOT_AIR", async () => {
    vi.mocked(postAirClientFillPageUtil).mockResolvedValue({
      ok: false,
      code: "NOT_AIR",
      message: "Skugr competitor is not air",
    });
    const req = { params: { id }, body } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await postAirClientFillPageController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Skugr competitor is not air",
      code: "NOT_AIR",
    });
  });

  it("400 when util reports URL_MISMATCH", async () => {
    vi.mocked(postAirClientFillPageUtil).mockResolvedValue({
      ok: false,
      code: "URL_MISMATCH",
      message: "sourceUrl does not match Skugr.url",
    });
    const req = { params: { id }, body } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await postAirClientFillPageController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "sourceUrl does not match Skugr.url",
      code: "URL_MISMATCH",
    });
  });

  it("400 when util reports PAGE_URL_MISMATCH", async () => {
    vi.mocked(postAirClientFillPageUtil).mockResolvedValue({
      ok: false,
      code: "PAGE_URL_MISMATCH",
      message: "pageUrl is not a listing page of this Air group",
    });
    const req = { params: { id }, body } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await postAirClientFillPageController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "pageUrl is not a listing page of this Air group",
      code: "PAGE_URL_MISMATCH",
    });
  });

  it("200 on filled page", async () => {
    vi.mocked(postAirClientFillPageUtil).mockResolvedValue({
      ok: true,
      stats: {
        fetched: 1,
        dedupedByUrl: 0,
        skippedAlreadyInGroup: 0,
        skippedNoProductId: 0,
        skippedProductIdConflict: 0,
        skippedNonNewskuManufacturer: 0,
        promotedFromNewsku: 0,
        linkedExisting: 0,
        created: 1,
      },
      nextPageUrl: "https://airballoons.com.ua/g?page=2",
      productsOnPage: 1,
    });
    const req = { params: { id }, body } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await postAirClientFillPageController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Air client skugr page filled successfully",
      data: {
        stats: expect.objectContaining({ created: 1 }),
        nextPageUrl: "https://airballoons.com.ua/g?page=2",
        productsOnPage: 1,
      },
    });
  });
});
