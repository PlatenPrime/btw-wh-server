import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAirClientSkugrPendingController } from "../getAirClientSkugrPendingController.js";

vi.mock("../utils/getAirClientSkugrPendingUtil.js", () => ({
  getAirClientSkugrPendingUtil: vi.fn(),
}));

import { getAirClientSkugrPendingUtil } from "../utils/getAirClientSkugrPendingUtil.js";

describe("getAirClientSkugrPendingController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("200 returns pending payload", async () => {
    vi.mocked(getAirClientSkugrPendingUtil).mockResolvedValue({
      items: [
        {
          skugrId: "g1",
          title: "Group",
          url: "https://airballoons.com.ua/g",
          prodName: "acme",
        },
      ],
    });

    const req = {} as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await getAirClientSkugrPendingController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Air client skugr pending retrieved successfully",
      data: {
        items: [
          {
            skugrId: "g1",
            title: "Group",
            url: "https://airballoons.com.ua/g",
            prodName: "acme",
          },
        ],
      },
    });
  });
});
