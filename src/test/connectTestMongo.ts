import { readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";
import { DEFAULT_MONGOD_VERSION } from "./ensureMongodBinary.js";
import { testMongoGlobalState } from "./testMongoState.js";

const MONGO_STARTUP_TIMEOUT_MS = 120_000;
const DEFAULT_MONGOD_DOWNLOAD_DIR = join(homedir(), ".cache", "mongodb-binaries");

export function createTestMongoReplSetOptions(downloadDir: string) {
  return {
    replSet: { count: 1 },
    instanceOpts: [{ launchTimeout: MONGO_STARTUP_TIMEOUT_MS }],
    binary: { downloadDir, version: DEFAULT_MONGOD_VERSION },
  };
}

export function getTestMongoUriPath(): string {
  return join(tmpdir(), "btw-wh-test-mongo.uri");
}

export function getMongodDownloadDir(): string {
  return process.env.MONGOMS_DOWNLOAD_DIR ?? DEFAULT_MONGOD_DOWNLOAD_DIR;
}

export function connectTestMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    return Promise.resolve();
  }

  if (!testMongoGlobalState.mongoConnectPromise) {
    const uri = readFileSync(getTestMongoUriPath(), "utf8");
    testMongoGlobalState.mongoConnectPromise = mongoose.connect(uri).then(
      () => undefined,
      (error: unknown) => {
        testMongoGlobalState.mongoConnectPromise = undefined;
        throw error;
      },
    );
  }

  return testMongoGlobalState.mongoConnectPromise;
}
