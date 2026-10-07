import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import {
  correctSvbumFakeStockSpikesUtil,
  type CorrectSvbumFakeStockSpikesInput,
  type CorrectSvbumFakeStockSpikesResult,
} from "../utils/correctSvbumFakeStockSpikesUtil.js";
import { parseCorrectSvbumFakeStockCliArgs } from "./parseCorrectSvbumFakeStockCliArgs.js";

export function resolveCorrectSvbumFakeStockCliInput(
  argv: string[]
): CorrectSvbumFakeStockSpikesInput {
  const args = parseCorrectSvbumFakeStockCliArgs(argv);
  return {
    daysBack: args.daysBack,
    apply: args.apply,
    ...(args.asOf ? { asOf: args.asOf } : {}),
    ...(args.lookbackDays !== undefined
      ? { lookbackDays: args.lookbackDays }
      : {}),
  };
}

export async function executeCorrectSvbumFakeStockCli(
  argv: string[]
): Promise<CorrectSvbumFakeStockSpikesResult> {
  const input = resolveCorrectSvbumFakeStockCliInput(argv);
  const result = await correctSvbumFakeStockSpikesUtil(input);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function runCorrectSvbumFakeStockConnected(
  argv: string[]
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeCorrectSvbumFakeStockCli(argv);
  } finally {
    await mongoose.disconnect();
  }
}

function isExecutedAsCli(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(entry);
}

if (isExecutedAsCli()) {
  runCorrectSvbumFakeStockConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
