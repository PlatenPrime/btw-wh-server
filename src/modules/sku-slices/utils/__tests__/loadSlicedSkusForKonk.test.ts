import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSlicedSkusForKonk } from "../loadSlicedSkusForKonk.js";

vi.mock("../../../skus/models/Sku.js", () => ({
  Sku: { find: vi.fn() },
}));
vi.mock("../../../skugrs/models/Skugr.js", () => ({
  Skugr: { find: vi.fn() },
}));

import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../../skugrs/models/Skugr.js";

describe("loadSlicedSkusForKonk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array without querying Sku when no sliced groups", async () => {
    vi.mocked(Skugr.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as never);

    const result = await loadSlicedSkusForKonk("air");

    expect(result).toEqual([]);
    expect(Sku.find).not.toHaveBeenCalled();
  });

  it("loads deduplicated skus with custom select", async () => {
    vi.mocked(Skugr.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { skus: [{ toString: () => "id1" }, { toString: () => "id2" }] },
          { skus: [{ toString: () => "id2" }] },
        ]),
      }),
    } as never);
    vi.mocked(Sku.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" }, productId: "air-1" },
        ]),
      }),
    } as never);

    const result = await loadSlicedSkusForKonk(
      "air",
      "_id productId title url"
    );

    expect(Sku.find).toHaveBeenCalledWith({
      konkName: "air",
      _id: { $in: ["id1", "id2"] },
    });
    expect(vi.mocked(Sku.find).mock.results[0]?.value.select).toHaveBeenCalledWith(
      "_id productId title url"
    );
    expect(result).toHaveLength(1);
  });
});
