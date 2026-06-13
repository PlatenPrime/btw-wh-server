import type { MongoMemoryReplSet } from "mongodb-memory-server";

export type TestMongoGlobalState = {
  mongoMemoryReplSet?: MongoMemoryReplSet;
  mongoConnectPromise?: Promise<void>;
};

export const testMongoGlobalState = globalThis as typeof globalThis &
  TestMongoGlobalState;
