import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import {
  rescaleDojdevikPackSlicesUtil,
  type RescaleDojdevikPackSlicesResult,
} from "../utils/dojdevik-pack-rescale/rescaleDojdevikPackSlicesUtil.js";
import { parseRescaleDojdevikPackCliArgs } from "./parseRescaleDojdevikPackCliArgs.js";

export async function executeRescaleDojdevikPackSlicesCli(
  argv: string[],
): Promise<RescaleDojdevikPackSlicesResult> {
  const args = parseRescaleDojdevikPackCliArgs(argv);
  const mode = args.apply ? "APPLY" : "DRY-RUN";
  console.log(
    `[rescale-dojdevik-pack] start mode=${mode}` +
      (args.limit ? ` limit=${args.limit}` : "") +
      (args.productId ? ` productId=${args.productId}` : "") +
      (args.jitterMinMs !== undefined && args.jitterMaxMs !== undefined
        ? ` jitter=${args.jitterMinMs}-${args.jitterMaxMs}ms`
        : " jitter=sku-slice-default"),
  );

  const result = await rescaleDojdevikPackSlicesUtil({
    ...args,
    onProgress: ({ index, total, item, mismatched, rescaled, fetchErrors }) => {
      console.log(
        `[rescale-dojdevik-pack] ${index}/${total} ${item.productId} status=${item.status}` +
          (item.packOld && item.packNew && item.packOld !== item.packNew
            ? ` pack ${item.packOld}→${item.packNew}`
            : "") +
          ` mismatched=${mismatched} rescaled=${rescaled} fetchErrors=${fetchErrors}`,
      );
    },
  });
  const mismatched = result.items.filter(
    (i) => i.status === "would-rescale" || i.status === "rescaled",
  );
  console.log(
    `[rescale-dojdevik-pack] scanned=${result.scanned} mismatched=${result.mismatched} ` +
      `rescaled=${result.rescaled} fetchErrors=${result.fetchErrors} ` +
      `jitter=${result.jitterMinMs}-${result.jitterMaxMs}ms` +
      (result.minDay && result.maxDay ? ` days=${result.minDay}..${result.maxDay}` : ""),
  );
  for (const item of mismatched) {
    console.log(
      `[rescale-dojdevik-pack]   ${item.productId} pack ${item.packOld}→${item.packNew} ` +
        `daysChanged=${item.daysChanged} status=${item.status}`,
    );
  }
  for (const item of result.items.filter((i) => i.status === "fetch-error")) {
    console.log(`[rescale-dojdevik-pack]   FETCH FAIL ${item.productId}: ${item.error}`);
  }

  console.log(JSON.stringify(result, null, 2));
  return result;
}

export async function runRescaleDojdevikPackSlicesConnected(argv: string[]): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeRescaleDojdevikPackSlicesCli(argv);
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
  runRescaleDojdevikPackSlicesConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
