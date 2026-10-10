import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import {
  migrateAllSkuSlicesToMonthsUtil,
  verifyRandomSkuSlicesVsMonths,
  type MigrateAllSkuSlicesToMonthsResult,
} from "../utils/migrateAllSkuSlicesToMonthsUtil.js";
import { parseMigrateAllSkuSlicesToMonthsCliArgs } from "./parseMigrateAllSkuSlicesToMonthsCliArgs.js";

export async function executeMigrateAllSkuSlicesToMonthsCli(
  argv: string[],
): Promise<{
  migrate: MigrateAllSkuSlicesToMonthsResult;
  verify?: Awaited<ReturnType<typeof verifyRandomSkuSlicesVsMonths>>;
}> {
  const args = parseMigrateAllSkuSlicesToMonthsCliArgs(argv);
  const mode = args.apply ? "APPLY" : "DRY-RUN";
  console.log(
    `[migrate-sku-slice-months] start mode=${mode}` +
      (args.konkName ? ` konk=${args.konkName}` : "") +
      ` verify=${args.verify} sample=${args.verifySample}`,
  );

  const migrate = await migrateAllSkuSlicesToMonthsUtil({
    apply: args.apply,
    ...(args.konkName ? { konkName: args.konkName } : {}),
    onProgress: (info) => {
      console.log(
        `[${info.sliceIndex}/${info.slicesTotal}] ${info.konkName} ${info.date} ` +
          `keys=${info.keysInSlice} cumulative=${info.dayWritesCumulative} ` +
          `apply=${info.apply}`,
      );
    },
  });

  console.log(
    `[migrate-sku-slice-months] migrate finished slices=${migrate.slicesRead}/${migrate.slicesTotal} ` +
      `wouldWrite=${migrate.dayWritesWouldWrite} upserted=${migrate.dayWritesUpserted} ` +
      `monthsTouched=${migrate.monthsTouched}`,
  );
  console.log(JSON.stringify(migrate, null, 2));

  let verify: Awaited<ReturnType<typeof verifyRandomSkuSlicesVsMonths>> | undefined;
  if (args.verify) {
    if (!args.apply) {
      console.log(
        "[migrate-sku-slice-months] skip verify on dry-run (no writes); pass --apply for verify",
      );
    } else {
      console.log(
        `[migrate-sku-slice-months] verify sample=${args.verifySample}…`,
      );
      verify = await verifyRandomSkuSlicesVsMonths(
        args.verifySample,
        args.konkName,
      );
      console.log(JSON.stringify(verify, null, 2));
      if (!verify.ok) {
        console.error(
          `[migrate-sku-slice-months] VERIFY FAILED mismatches=${verify.mismatches.length}`,
        );
        process.exitCode = 1;
      } else {
        console.log(
          `[migrate-sku-slice-months] verify OK compared=${verify.compared}`,
        );
      }
    }
  }

  return { migrate, ...(verify ? { verify } : {}) };
}

export async function runMigrateAllSkuSlicesToMonthsConnected(
  argv: string[],
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeMigrateAllSkuSlicesToMonthsCli(argv);
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
  runMigrateAllSkuSlicesToMonthsConnected(process.argv.slice(2)).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
