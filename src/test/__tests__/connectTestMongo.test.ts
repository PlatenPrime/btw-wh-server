import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_MONGOD_VERSION } from "../ensureMongodBinary.js";
import { createTestMongoReplSetOptions, getTestMongoUriPath } from "../connectTestMongo.js";

describe("createTestMongoReplSetOptions", () => {
  it("pins the replset binary to the repaired mongod version", () => {
    const options = createTestMongoReplSetOptions("C:\\cache\\mongodb-binaries");

    expect(options.binary).toEqual({
      downloadDir: "C:\\cache\\mongodb-binaries",
      version: DEFAULT_MONGOD_VERSION,
    });
    expect(options.binary.version).toBe("7.0.14");
    expect(options.replSet.count).toBe(1);
    expect(options.instanceOpts[0]?.launchTimeout).toBe(120_000);
  });

  it("gives every worker the same uri file", () => {
    expect(getTestMongoUriPath()).toBe(join(tmpdir(), "btw-wh-test-mongo.uri"));
  });
});
