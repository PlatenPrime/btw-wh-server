import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../../../models/Del.js";
import { updateDelTitleByIdUtil } from "../updateDelTitleByIdUtil.js";

describe("updateDelTitleByIdUtil", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
  });

  it("returns null when del not found", async () => {
    const result = await updateDelTitleByIdUtil({
      id: "000000000000000000000000",
      title: "New title",
    });
    expect(result).toBeNull();
  });

  it("updates title and returns updated document", async () => {
    const del = await Del.create({
      title: "Old title",
      artikuls: {},
    });
    const result = await updateDelTitleByIdUtil({
      id: del._id.toString(),
      title: "New title",
    });
    expect(result?.title).toBe("New title");
    const found = await Del.findById(del._id);
    expect(found?.title).toBe("New title");
  });
});
