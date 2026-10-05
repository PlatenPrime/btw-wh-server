import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import { stripMixedSliceSalesFields } from "../../sku-reporting/utils/stripMixedSliceSalesUtil.js";
import { parseBackfillSkuSliceSalesCliArgs } from "./parseBackfillSkuSliceSalesCliArgs.js";

/** Логировать doc каждые N шагов (+ всегда первый и последний). */
const DOC_LOG_EVERY = 25;

/**
 * CLI: снять salesPcs/salesUah из Mixed data SkuSlice/BtradeSlice.
 *
 * npx tsx src/modules/sku-slices/scripts/runUnsetMixedSliceSales.ts --from YYYY-MM-DD --to YYYY-MM-DD [--konk name] [--apply]
 */
export async function executeUnsetMixedSliceSalesCli(
  argv: string[],
): Promise<{
  apply: boolean;
  skuDocsTouched: number;
  btradeDocsTouched: number;
}> {
  const args = parseBackfillSkuSliceSalesCliArgs(argv);
  const mode = args.apply ? "APPLY" : "DRY-RUN";
  const fromKey = args.from.toISOString().slice(0, 10);
  const toKey = args.to.toISOString().slice(0, 10);

  console.log(
    `[unset-mixed-sales] start mode=${mode} range=${fromKey}..${toKey}` +
      (args.konkName ? ` konk=${args.konkName}` : ""),
  );

  const r = await stripMixedSliceSalesFields({
    fromDate: args.from,
    toDate: args.to,
    konkName: args.konkName,
    apply: args.apply,
    onProgress: (info) => {
      if (info.event === "phase-start") {
        console.log(
          `[unset-mixed-sales] ${info.phase}: found ${info.total} docs, scanning…`,
        );
        return;
      }
      const isEdge = info.scanned === 1 || info.scanned === info.total;
      const isStep = info.scanned % DOC_LOG_EVERY === 0;
      if (!isEdge && !isStep) return;
      const who =
        info.phase === "sku"
          ? `${info.konkName ?? "?"} ${info.day ?? "?"}`
          : (info.day ?? "?");
      console.log(
        `[unset-mixed-sales] ${info.phase} ${info.scanned}/${info.total}` +
          ` touched=${info.touched} ${who}`,
      );
    },
  });

  console.log(
    `[unset-mixed-sales] finished` +
      ` skuScanned=${r.skuDocsScanned} skuTouched=${r.skuDocsTouched}` +
      ` btradeScanned=${r.btradeDocsScanned} btradeTouched=${r.btradeDocsTouched}`,
  );
  const payload = {
    apply: args.apply,
    skuDocsTouched: r.skuDocsTouched,
    btradeDocsTouched: r.btradeDocsTouched,
  };
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export async function runUnsetMixedSliceSalesConnected(
  argv: string[],
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeUnsetMixedSliceSalesCli(argv);
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
  runUnsetMixedSliceSalesConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
