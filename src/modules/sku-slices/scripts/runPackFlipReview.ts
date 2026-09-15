import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import { packFlipAutoApplyKonks } from "../../slices/config/packFlipAutoApplyKonks.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import {
  defaultPackFlipReviewDates,
  reviewPackFlipsUtil,
  type PackFlipReviewResult,
} from "../utils/reviewPackFlipsUtil.js";
import { parsePackFlipCliArgs } from "./parsePackFlipCliArgs.js";

export function resolvePackFlipCliDates(argv: string[]): {
  dates: Date[];
  apply: boolean;
  konkName: string;
} {
  const args = parsePackFlipCliArgs(argv);
  const konkName = args.konkName ?? packFlipAutoApplyKonks[0];
  if (!konkName) {
    throw new Error("Specify --konk or configure packFlipAutoApplyKonks");
  }
  const dates =
    args.from && args.to
      ? enumerateReportingDates(args.from, args.to)
      : defaultPackFlipReviewDates();
  return {
    dates,
    apply: args.apply,
    konkName,
  };
}

export async function executePackFlipReviewCli(
  argv: string[]
): Promise<PackFlipReviewResult> {
  const parsed = resolvePackFlipCliDates(argv);
  const result = await reviewPackFlipsUtil(parsed);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function runPackFlipReviewConnected(
  argv: string[]
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executePackFlipReviewCli(argv);
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
  runPackFlipReviewConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
