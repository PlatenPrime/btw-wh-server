import mongoose from "mongoose";
import { testMongoGlobalState } from "./testMongoState.js";
export default async function globalTeardown() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
    catch (error) {
        console.error("Error closing mongoose in globalTeardown:", error);
    }
    try {
        if (testMongoGlobalState.mongoMemoryReplSet) {
            await testMongoGlobalState.mongoMemoryReplSet.stop();
            testMongoGlobalState.mongoMemoryReplSet = undefined;
        }
    }
    catch (error) {
        console.error("Error stopping MongoMemoryReplSet in globalTeardown:", error);
    }
    testMongoGlobalState.mongoConnectPromise = undefined;
}
