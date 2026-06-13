import { homedir } from "node:os";
import { join } from "node:path";
import { ensureMongodBinary } from "../ensureMongodBinary.js";

const downloadDir =
  process.env.MONGOMS_DOWNLOAD_DIR ??
  join(homedir(), ".cache", "mongodb-binaries");

await ensureMongodBinary(downloadDir);
console.log(`MongoDB test binary is ready in ${downloadDir}`);
