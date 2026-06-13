import { homedir } from "node:os";
import { join } from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ensureMongodBinary } from "./ensureMongodBinary.js";
import { testMongoGlobalState } from "./testMongoState.js";
const MONGO_STARTUP_TIMEOUT_MS = 120_000;
const DEFAULT_MONGOD_DOWNLOAD_DIR = join(homedir(), ".cache", "mongodb-binaries");
function getMongodDownloadDir() {
    return process.env.MONGOMS_DOWNLOAD_DIR ?? DEFAULT_MONGOD_DOWNLOAD_DIR;
}
export function connectTestMongo() {
    if (mongoose.connection.readyState !== 0) {
        return Promise.resolve();
    }
    if (!testMongoGlobalState.mongoConnectPromise) {
        testMongoGlobalState.mongoConnectPromise = (async () => {
            if (!testMongoGlobalState.mongoMemoryReplSet) {
                const downloadDir = getMongodDownloadDir();
                await ensureMongodBinary(downloadDir);
                testMongoGlobalState.mongoMemoryReplSet =
                    await MongoMemoryReplSet.create({
                        replSet: { count: 1 },
                        instanceOpts: [{ launchTimeout: MONGO_STARTUP_TIMEOUT_MS }],
                        binary: { downloadDir },
                    });
            }
            await mongoose.connect(testMongoGlobalState.mongoMemoryReplSet.getUri());
        })().catch((error) => {
            testMongoGlobalState.mongoConnectPromise = undefined;
            throw error;
        });
    }
    return testMongoGlobalState.mongoConnectPromise;
}
