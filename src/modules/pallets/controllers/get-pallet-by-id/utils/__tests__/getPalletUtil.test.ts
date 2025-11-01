import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos } from "../../../../../../test/utils/testHelpers.js";
import { Pallet } from "../../../../models/Pallet.js";
import { getPalletUtil } from "../getPalletUtil.js";

describe("getPalletUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает паллету с populate poses", async () => {
    const pallet = await createTestPallet({ title: "Pallet-1" });
    const pos1 = await createTestPos({
      pallet: pallet._id,
      palletData: {
        _id: pallet._id,
        title: pallet.title,
        sector: pallet.sector,
        isDef: pallet.isDef,
      },
      palletTitle: pallet.title,
      artikul: "ART-A",
    });
    const pos2 = await createTestPos({
      pallet: pallet._id,
      palletData: {
        _id: pallet._id,
        title: pallet.title,
        sector: pallet.sector,
        isDef: pallet.isDef,
      },
      palletTitle: pallet.title,
      artikul: "ART-B",
    });

    pallet.poses = [pos1._id, pos2._id];
    await pallet.save();

    const result = await getPalletUtil(String(pallet._id));

    expect(result).not.toBeNull();
    expect(result?.title).toBe("Pallet-1");
    expect(result?.poses).toBeDefined();
    expect(Array.isArray(result?.poses)).toBe(true);
    expect(result?.poses.length).toBe(2);
  });

  it("возвращает null если паллета не найдена", async () => {
    const result = await getPalletUtil(
      new mongoose.Types.ObjectId().toString()
    );

    expect(result).toBeNull();
  });
});


