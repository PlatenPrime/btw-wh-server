import mongoose from "mongoose";
import { logModuleError } from "../logging/logModuleError.js";
import { testMongoGlobalState } from "./testMongoState.js";
export default async function globalTeardown() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
    catch (error) {
        logModuleError("test", error, "failed to close mongoose in globalTeardown");
    }
    try {
        if (testMongoGlobalState.mongoMemoryReplSet) {
            await testMongoGlobalState.mongoMemoryReplSet.stop();
            testMongoGlobalState.mongoMemoryReplSet = undefined;
        }
    }
    catch (error) {
        logModuleError("test", error, "failed to stop MongoMemoryReplSet in globalTeardown");
    }
    testMongoGlobalState.mongoConnectPromise = undefined;
}
