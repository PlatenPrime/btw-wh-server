import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { deleteZoneByIdUtil } from "../deleteZoneByIdUtil.js";

describe("deleteZoneByIdUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("удаляет зону и возвращает удалённый документ", async () => {
    const zone = await Zone.create({ title: "90-1", bar: 9010, sector: 0 });

    const result = await deleteZoneByIdUtil(zone._id.toString());

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(zone._id.toString());
    expect(result?.title).toBe("90-1");

    const deleted = await Zone.findById(zone._id);
    expect(deleted).toBeNull();
  });

  it("возвращает null если зона не найдена", async () => {
    const result = await deleteZoneByIdUtil("000000000000000000000000");

    expect(result).toBeNull();
  });
});







