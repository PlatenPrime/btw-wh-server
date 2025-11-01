import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { getZoneByIdUtil } from "../getZoneByIdUtil.js";

describe("getZoneByIdUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает null если зона не найдена", async () => {
    const result = await getZoneByIdUtil("000000000000000000000000");

    expect(result).toBeNull();
  });

  it("возвращает зону по ID", async () => {
    const zone = await Zone.create({ title: "70-1", bar: 7010, sector: 0 });

    const result = await getZoneByIdUtil(zone._id.toString());

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(zone._id.toString());
    expect(result?.title).toBe("70-1");
  });

  it("возвращает зону с правильной структурой", async () => {
    const zone = await Zone.create({
      title: "71-2",
      bar: 7120,
      sector: 1,
    });

    const result = await getZoneByIdUtil(zone._id.toString());

    expect(result).toBeTruthy();
    expect(result?._id).toBeDefined();
    expect(result?.title).toBe("71-2");
    expect(result?.bar).toBe(7120);
    expect(result?.sector).toBe(1);
    expect(result?.createdAt).toBeDefined();
    expect(result?.updatedAt).toBeDefined();
  });
});





