import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import {
  defaultPackFlipReviewDates,
  reviewPerfectPackFlipsUtil,
  type PackFlipReviewResult,
} from "../utils/reviewPerfectPackFlipsUtil.js";
import { parsePerfectPackFlipCliArgs } from "./parsePerfectPackFlipCliArgs.js";

export function resolvePerfectPackFlipCliDates(argv: string[]): {
  dates: Date[];
  apply: boolean;
  konkName?: string;
} {
  const args = parsePerfectPackFlipCliArgs(argv);
  const dates =
    args.from && args.to
      ? enumerateReportingDates(args.from, args.to)
      : defaultPackFlipReviewDates();
  return {
    dates,
    apply: args.apply,
    ...(args.konkName ? { konkName: args.konkName } : {}),
  };
}

export async function executePerfectPackFlipReviewCli(
  argv: string[]
): Promise<PackFlipReviewResult> {
  const parsed = resolvePerfectPackFlipCliDates(argv);
  const result = await reviewPerfectPackFlipsUtil(parsed);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function runPerfectPackFlipReviewConnected(
  argv: string[]
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executePerfectPackFlipReviewCli(argv);
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
  runPerfectPackFlipReviewConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
