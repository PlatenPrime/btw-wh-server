import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import {
  materializeSkuSliceMonthsUtil,
  type MaterializeSkuSliceMonthsInput,
  type MaterializeSkuSliceMonthsResult,
} from "../utils/materializeSkuSliceMonthsUtil.js";
import { parseMaterializeSkuSliceMonthsCliArgs } from "./parseMaterializeSkuSliceMonthsCliArgs.js";

export function resolveMaterializeSkuSliceMonthsCliInput(
  argv: string[],
): MaterializeSkuSliceMonthsInput {
  const args = parseMaterializeSkuSliceMonthsCliArgs(argv);
  return {
    daysBack: args.daysBack,
    apply: args.apply,
    ...(args.asOf ? { asOf: args.asOf } : {}),
    ...(args.konkName ? { konkName: args.konkName } : {}),
  };
}

export async function executeMaterializeSkuSliceMonthsCli(
  argv: string[],
): Promise<MaterializeSkuSliceMonthsResult> {
  const input = resolveMaterializeSkuSliceMonthsCliInput(argv);
  const mode = input.apply ? "APPLY" : "DRY-RUN";
  console.log(
    `[sku-slice-months] start mode=${mode} daysBack=${input.daysBack}` +
      (input.asOf
        ? ` asOf=${input.asOf.toISOString().slice(0, 10)}`
        : "") +
      (input.konkName ? ` konk=${input.konkName}` : ""),
  );

  const result = await materializeSkuSliceMonthsUtil({
    ...input,
    onProgress: (info) => {
      console.log(
        `[${info.sliceIndex}/${info.slicesTotal}] ${info.konkName} ${info.date} ` +
          `days=${info.daysWrittenInSlice} cumulative=${info.dayWritesCumulative} ` +
          `apply=${info.apply}`,
      );
    },
  });

  console.log(
    `[sku-slice-months] finished slices=${result.slicesRead} ` +
      `wouldWrite=${result.dayWritesWouldWrite} upserted=${result.dayWritesUpserted} ` +
      `monthsTouched=${result.monthsTouched}`,
  );
  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function runMaterializeSkuSliceMonthsConnected(
  argv: string[],
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeMaterializeSkuSliceMonthsCli(argv);
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
  runMaterializeSkuSliceMonthsConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
