import { afterEach, describe, expect, it } from "vitest";

import { getMongoUri } from "../getMongoUri.js";

describe("getMongoUri", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns MONGODB_URI when set", () => {
    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/btw";

    expect(getMongoUri()).toBe(process.env.MONGODB_URI);
  });

  it("builds URI from DB_* and MONGO_CLUSTER_HOST when MONGODB_URI is missing", () => {
    delete process.env.MONGODB_URI;
    process.env.DB_USER = "test-user";
    process.env.DB_PASSWORD = "test-password";
    process.env.DB_NAME = "test-db";
    process.env.MONGO_CLUSTER_HOST = "mongo.example.test";

    expect(getMongoUri()).toBe(
      "mongodb+srv://test-user:test-password@mongo.example.test/test-db?retryWrites=true&w=majority"
    );
  });
});
