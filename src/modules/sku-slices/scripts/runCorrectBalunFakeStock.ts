import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import {
  correctBalunFakeStockSpikesUtil,
  type CorrectBalunFakeStockSpikesInput,
  type CorrectBalunFakeStockSpikesResult,
} from "../utils/correctBalunFakeStockSpikesUtil.js";
import { parseCorrectBalunFakeStockCliArgs } from "./parseCorrectBalunFakeStockCliArgs.js";

export function resolveCorrectBalunFakeStockCliInput(
  argv: string[]
): CorrectBalunFakeStockSpikesInput {
  const args = parseCorrectBalunFakeStockCliArgs(argv);
  return {
    daysBack: args.daysBack,
    apply: args.apply,
    ...(args.asOf ? { asOf: args.asOf } : {}),
    ...(args.lookbackDays !== undefined
      ? { lookbackDays: args.lookbackDays }
      : {}),
  };
}

export async function executeCorrectBalunFakeStockCli(
  argv: string[]
): Promise<CorrectBalunFakeStockSpikesResult> {
  const input = resolveCorrectBalunFakeStockCliInput(argv);
  const result = await correctBalunFakeStockSpikesUtil(input);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function runCorrectBalunFakeStockConnected(
  argv: string[]
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeCorrectBalunFakeStockCli(argv);
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
  runCorrectBalunFakeStockConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
