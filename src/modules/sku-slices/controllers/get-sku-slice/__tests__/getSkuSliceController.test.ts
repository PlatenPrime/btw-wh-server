import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { getSkuSliceController } from "../getSkuSliceController.js";

describe("getSkuSliceController", () => {
  it("returns 410 with migration pointers", async () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    await getSkuSliceController({} as Request, res);

    expect(status).toHaveBeenCalledWith(410);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [
          expect.objectContaining({
            code: "SKU_SLICE_DAY_LIST_GONE",
          }),
        ],
      }),
    );
  });
});
