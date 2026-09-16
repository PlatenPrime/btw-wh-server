import { parentPort, workerData } from "node:worker_threads";
import mongoose from "mongoose";
import "../../../config/loadEnv.js";
import { executeExcelJobInProcess } from "../utils/executeExcelJobInProcess.js";

type ExcelJobWorkerData = {
  jobId: string;
  mongoUri: string;
};

const data = workerData as ExcelJobWorkerData;

async function main(): Promise<void> {
  await mongoose.connect(data.mongoUri);
  try {
    await executeExcelJobInProcess(data.jobId);
    parentPort?.postMessage({ type: "done", jobId: data.jobId });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  parentPort?.postMessage({
    type: "failed",
    jobId: data.jobId,
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
