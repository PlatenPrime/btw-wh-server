import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { getPosByIdUtil } from "../getPosByIdUtil.js";

describe("getPosByIdUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает найденную позицию по валидному id", async () => {
    const row = await createTestRow();
    const pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });
    const pos = await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      artikul: "ART-777",
    });

    const found = await getPosByIdUtil(pos._id.toString());

    expect(found).not.toBeNull();
    expect(found?.artikul).toBe("ART-777");
    expect(found?._id.toString()).toBe(pos._id.toString());
  });

  it("возвращает null для несуществующей позиции", async () => {
    const { Types } = await import("mongoose");
    const nonId = new Types.ObjectId().toString();
    const found = await getPosByIdUtil(nonId);
    expect(found).toBeNull();
  });
});

