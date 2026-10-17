import { rmSync, writeFileSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { logModuleError } from "../logging/logModuleError.js";
import {
  createTestMongoReplSetOptions,
  getMongodDownloadDir,
  getTestMongoUriPath,
} from "./connectTestMongo.js";
import { ensureMongodBinary } from "./ensureMongodBinary.js";

export default async function globalSetup(): Promise<() => Promise<void>> {
  const downloadDir = getMongodDownloadDir();
  await ensureMongodBinary(downloadDir);

  const replSet = await MongoMemoryReplSet.create(createTestMongoReplSetOptions(downloadDir));
  const uriPath = getTestMongoUriPath();
  writeFileSync(uriPath, replSet.getUri(), "utf8");

  return async function globalTeardown(): Promise<void> {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (error) {
      logModuleError("test", error, "failed to close mongoose in globalTeardown");
    }

    try {
      await replSet.stop();
    } catch (error) {
      logModuleError("test", error, "failed to stop MongoMemoryReplSet in globalTeardown");
    }

    rmSync(uriPath, { force: true });
  };
}
