import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { getAskUtil } from "../getAskUtil.js";
import { createTestAsk } from "../../../../../../test/setup.js";

describe("getAskUtil", () => {
  it("возвращает найденную заявку по валидному id", async () => {
    const ask = await createTestAsk({ artikul: "ART-777" });
    const found = await getAskUtil(String(ask._id));
    expect(found).not.toBeNull();
    expect(found?.artikul).toBe("ART-777");
    expect(String(found?._id)).toBe(String(ask._id));
  });

  it("возвращает null для несуществующей заявки", async () => {
    const nonId = new mongoose.Types.ObjectId().toString();
    const found = await getAskUtil(nonId);
    expect(found).toBeNull();
  });
});


