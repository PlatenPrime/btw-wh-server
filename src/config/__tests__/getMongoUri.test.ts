import { afterEach, describe, expect, it } from "vitest";

import { getMongoUri } from "../getMongoUri.js";

describe("getMongoUri", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns MONGODB_URI when set", () => {
    process.env.MONGODB_URI =
      "mongodb+srv://user:pass@cluster0.b6qtdz4.mongodb.net/btw?retryWrites=true&w=majority";

    expect(getMongoUri()).toBe(process.env.MONGODB_URI);
  });

  it("builds URI from DB_* env vars when MONGODB_URI is missing", () => {
    delete process.env.MONGODB_URI;
    process.env.DB_USER = "test-user";
    process.env.DB_PASSWORD = "test-password";
    process.env.DB_NAME = "test-db";

    expect(getMongoUri()).toBe(
      "mongodb+srv://test-user:test-password@cluster0.b6qtdz4.mongodb.net/test-db?retryWrites=true&w=majority"
    );
  });
});
