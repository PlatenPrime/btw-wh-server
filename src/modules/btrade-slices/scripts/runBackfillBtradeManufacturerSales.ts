import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import { materializeBtradeManufacturerSalesDateRange } from "../../sku-reporting/utils/materializeBtradeManufacturerSalesUtil.js";
import { parseBackfillBtradeManufacturerSalesCliArgs } from "./parseBackfillBtradeManufacturerSalesCliArgs.js";

const DAY_LOG_EVERY = 7;

/**
 * CLI: backfill BtradeManufacturerDaySales.
 *
 * npx tsx src/modules/btrade-slices/scripts/runBackfillBtradeManufacturerSales.ts --from YYYY-MM-DD --to YYYY-MM-DD [--apply]
 */
export async function executeBackfillBtradeManufacturerSalesCli(
  argv: string[],
): Promise<{
  apply: boolean;
  daysTouched: string[];
  keysUpdated: number;
  rollupDocs: number;
}> {
  const args = parseBackfillBtradeManufacturerSalesCliArgs(argv);
  const mode = args.apply ? "APPLY" : "DRY-RUN";
  const fromKey = args.from.toISOString().slice(0, 10);
  const toKey = args.to.toISOString().slice(0, 10);

  console.log(
    `[backfill-btrade-rollup] start mode=${mode} range=${fromKey}..${toKey}`,
  );

  const started = Date.now();
  const r = await materializeBtradeManufacturerSalesDateRange({
    fromDate: args.from,
    toDate: args.to,
    apply: args.apply,
    onProgress: ({ day, dayIndex, dayTotal, keysUpdated, rollupDocs }) => {
      const isEdge = dayIndex === 1 || dayIndex === dayTotal;
      const isStep = dayIndex % DAY_LOG_EVERY === 0;
      if (!isEdge && !isStep) return;
      console.log(
        `[backfill-btrade-rollup] day ${dayIndex}/${dayTotal} ${day}` +
          ` keys=${keysUpdated} rollupDocs=${rollupDocs}`,
      );
    },
  });

  const sec = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `[backfill-btrade-rollup] finished mode=${mode}` +
      ` days=${r.daysTouched.length} keys=${r.keysUpdated}` +
      ` rollupDocs=${r.rollupDocs} ${sec}s`,
  );

  const payload = {
    apply: args.apply,
    daysTouched: r.daysTouched,
    keysUpdated: r.keysUpdated,
    rollupDocs: r.rollupDocs,
  };
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export async function runBackfillBtradeManufacturerSalesConnected(
  argv: string[],
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeBackfillBtradeManufacturerSalesCli(argv);
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
  runBackfillBtradeManufacturerSalesConnected(process.argv.slice(2)).catch(
    (err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(message);
      process.exitCode = 1;
    },
  );
}
