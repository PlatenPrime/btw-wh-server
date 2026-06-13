import mongoose, { Schema } from "mongoose";
import { afterEach, describe, expect, it } from "vitest";
import { getOrCreateModel } from "../getOrCreateModel.js";

describe("getOrCreateModel", () => {
  afterEach(async () => {
    if (mongoose.models.TestGetOrCreateModel) {
      delete mongoose.models.TestGetOrCreateModel;
    }
  });

  it("registers a model on first call", () => {
    const schema = new Schema({ name: String });
    const Model = getOrCreateModel<{ name: string }>(
      "TestGetOrCreateModel",
      schema,
    );

    expect(Model.modelName).toBe("TestGetOrCreateModel");
    expect(mongoose.models.TestGetOrCreateModel).toBe(Model);
  });

  it("returns existing model without OverwriteModelError", () => {
    const schema = new Schema({ name: String });
    const first = getOrCreateModel<{ name: string }>(
      "TestGetOrCreateModel",
      schema,
    );
    const second = getOrCreateModel<{ name: string }>(
      "TestGetOrCreateModel",
      schema,
    );

    expect(second).toBe(first);
  });
});
