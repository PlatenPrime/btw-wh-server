import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
}
process.env.BTW_TOKEN ??= "mock-token";
process.env.BTW_CHAT_ID ??= "-1002121224059";
process.env.KASA_CHAT_ID ??= "@kassabtw";
process.env.BTW_DEFS_CHAT_ID ??= "-1003183753234";
process.env.BTW_PLATEN_ID ??= "555196992";
