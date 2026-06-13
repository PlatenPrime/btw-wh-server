import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getMongodBinaryFileName,
  getMongodBinaryPath,
  getMongodZipEntryPath,
  getMongodZipFileName,
  getMongodZipPath,
  isRunnableMongodBinary,
} from "../ensureMongodBinary.js";

describe("ensureMongodBinary helpers", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("builds default mongod cache file names", () => {
    expect(getMongodBinaryFileName()).toBe("mongod-x64-win32-7.0.14.exe");
    expect(getMongodZipFileName()).toBe("mongodb-windows-x86_64-7.0.14.zip");
    expect(getMongodZipEntryPath()).toBe(
      "mongodb-win32-x86_64-windows-7.0.14/bin/mongod.exe",
    );
  });

  it("returns false for missing binary path", () => {
    tempDir = mkdtempSync(join(tmpdir(), "btw-mongod-test-"));
    expect(isRunnableMongodBinary(getMongodBinaryPath(tempDir))).toBe(false);
  });

  it("returns false for non-executable file", () => {
    tempDir = mkdtempSync(join(tmpdir(), "btw-mongod-test-"));
    const fakeBinaryPath = getMongodBinaryPath(tempDir);
    writeFileSync(fakeBinaryPath, "not-a-mongo-binary");
    expect(isRunnableMongodBinary(fakeBinaryPath)).toBe(false);
  });

  it("builds zip path inside download dir", () => {
    tempDir = mkdtempSync(join(tmpdir(), "btw-mongod-test-"));
    expect(getMongodZipPath(tempDir)).toBe(
      join(tempDir, "mongodb-windows-x86_64-7.0.14.zip"),
    );
  });
});
