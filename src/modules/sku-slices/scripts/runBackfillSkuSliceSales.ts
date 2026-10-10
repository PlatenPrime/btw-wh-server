import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import { SkuSliceMonth } from "../models/SkuSliceMonth.js";
import { toSliceMonthDate } from "../utils/skuSliceMonthKeys.js";
import { materializeSkuSliceSalesDateRange } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { parseBackfillSkuSliceSalesCliArgs } from "./parseBackfillSkuSliceSalesCliArgs.js";

/** Логировать день каждые N шагов (+ всегда первый и последний). */
const DAY_LOG_EVERY = 7;

export async function executeBackfillSkuSliceSalesCli(
  argv: string[],
): Promise<{
  apply: boolean;
  results: Array<{
    konkName: string;
    daysTouched: string[];
    keysUpdated: number;
  }>;
}> {
  const args = parseBackfillSkuSliceSalesCliArgs(argv);
  const mode = args.apply ? "APPLY" : "DRY-RUN";
  const fromKey = args.from.toISOString().slice(0, 10);
  const toKey = args.to.toISOString().slice(0, 10);

  console.log(
    `[backfill-sku-rollup] start mode=${mode} range=${fromKey}..${toKey}` +
      (args.konkName ? ` konk=${args.konkName}` : "") +
      (args.productId ? ` productId=${args.productId}` : ""),
  );

  const konkFilter = args.konkName ? { konkName: args.konkName } : {};
  const monthFrom = toSliceMonthDate(args.from);
  const monthTo = toSliceMonthDate(args.to);
  const konkNames = await SkuSliceMonth.distinct("konkName", {
    ...konkFilter,
    month: { $gte: monthFrom, $lte: monthTo },
  });
  const sorted = konkNames.sort();
  console.log(`[backfill-sku-rollup] konks=${sorted.length}`);

  const results: Array<{
    konkName: string;
    daysTouched: string[];
    keysUpdated: number;
  }> = [];

  for (let i = 0; i < sorted.length; i++) {
    const konkName = sorted[i]!;
    console.log(
      `[backfill-sku-rollup] konk ${i + 1}/${sorted.length}: ${konkName} …`,
    );
    const started = Date.now();
    const r = await materializeSkuSliceSalesDateRange({
      konkName,
      fromDate: args.from,
      toDate: args.to,
      productIds: args.productId ? [args.productId] : undefined,
      apply: args.apply,
      onProgress: ({ day, dayIndex, dayTotal, keysUpdated }) => {
        const isEdge = dayIndex === 1 || dayIndex === dayTotal;
        const isStep = dayIndex % DAY_LOG_EVERY === 0;
        if (!isEdge && !isStep) return;
        console.log(
          `[backfill-sku-rollup]   ${konkName} day ${dayIndex}/${dayTotal} ${day} keys=${keysUpdated}`,
        );
      },
    });
    const sec = ((Date.now() - started) / 1000).toFixed(1);
    console.log(
      `[backfill-sku-rollup] konk ${i + 1}/${sorted.length}: ${konkName} done ` +
        `days=${r.daysTouched.length} keys=${r.keysUpdated} ${sec}s`,
    );
    results.push({
      konkName: r.konkName,
      daysTouched: r.daysTouched,
      keysUpdated: r.keysUpdated,
    });
  }

  const totalKeys = results.reduce((s, r) => s + r.keysUpdated, 0);
  console.log(
    `[backfill-sku-rollup] finished mode=${mode} konks=${results.length} keys=${totalKeys}`,
  );

  const payload = { apply: args.apply, results };
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export async function runBackfillSkuSliceSalesConnected(
  argv: string[],
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeBackfillSkuSliceSalesCli(argv);
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
  runBackfillSkuSliceSalesConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
