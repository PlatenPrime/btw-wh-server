import dotenv from "dotenv";
import { homedir } from "node:os";
import { join } from "node:path";
dotenv.config({ path: ".env.test" });
// Keep mongod outside OneDrive-synced node_modules/.cache (Windows spawn EFTYPE).
process.env.MONGOMS_DOWNLOAD_DIR ??= join(homedir(), ".cache", "mongodb-binaries");
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
}
process.env.BTW_TOKEN ??= "mock-token";
process.env.BTW_CHAT_ID ??= "-1002121224059";
process.env.KASA_CHAT_ID ??= "@kassabtw";
process.env.BTW_DEFS_CHAT_ID ??= "-1003183753234";
process.env.BTW_PLATEN_ID ??= "555196992";
process.env.MONGOMS_STARTUP_TIMEOUT ??= "120000";
