import "../../../config/loadEnv.js";

import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMongoUri } from "../../../config/getMongoUri.js";
import {
  migrateAllBtradeSlicesToMonthsUtil,
  verifyRandomBtradeSlicesVsMonths,
  type MigrateAllBtradeSlicesToMonthsResult,
} from "../utils/migrateAllBtradeSlicesToMonthsUtil.js";
import { parseMigrateAllBtradeSlicesToMonthsCliArgs } from "./parseMigrateAllBtradeSlicesToMonthsCliArgs.js";

export async function executeMigrateAllBtradeSlicesToMonthsCli(
  argv: string[],
): Promise<{
  migrate: MigrateAllBtradeSlicesToMonthsResult;
  verify?: Awaited<ReturnType<typeof verifyRandomBtradeSlicesVsMonths>>;
}> {
  const args = parseMigrateAllBtradeSlicesToMonthsCliArgs(argv);
  const mode = args.apply ? "APPLY" : "DRY-RUN";
  console.log(
    `[migrate-btrade-slice-months] start mode=${mode}` +
      ` verify=${args.verify} sample=${args.verifySample}`,
  );

  const migrate = await migrateAllBtradeSlicesToMonthsUtil({
    apply: args.apply,
    onProgress: (info) => {
      console.log(
        `[${info.sliceIndex}/${info.slicesTotal}] ${info.date} ` +
          `keys=${info.keysInSlice} cumulative=${info.dayWritesCumulative} ` +
          `apply=${info.apply}`,
      );
    },
  });

  console.log(
    `[migrate-btrade-slice-months] migrate finished slices=${migrate.slicesRead}/${migrate.slicesTotal} ` +
      `wouldWrite=${migrate.dayWritesWouldWrite} upserted=${migrate.dayWritesUpserted} ` +
      `monthsTouched=${migrate.monthsTouched}`,
  );
  console.log(JSON.stringify(migrate, null, 2));

  let verify: Awaited<ReturnType<typeof verifyRandomBtradeSlicesVsMonths>> | undefined;
  if (args.verify) {
    if (!args.apply) {
      console.log(
        "[migrate-btrade-slice-months] skip verify on dry-run (no writes); pass --apply for verify",
      );
    } else {
      console.log(
        `[migrate-btrade-slice-months] verify sample=${args.verifySample}…`,
      );
      verify = await verifyRandomBtradeSlicesVsMonths(args.verifySample);
      console.log(JSON.stringify(verify, null, 2));
      if (!verify.ok) {
        console.error(
          `[migrate-btrade-slice-months] VERIFY FAILED mismatches=${verify.mismatches.length}`,
        );
        process.exitCode = 1;
      } else {
        console.log(
          `[migrate-btrade-slice-months] verify OK compared=${verify.compared}`,
        );
      }
    }
  }

  return { migrate, ...(verify ? { verify } : {}) };
}

export async function runMigrateAllBtradeSlicesToMonthsConnected(
  argv: string[],
): Promise<void> {
  await mongoose.connect(getMongoUri());
  try {
    await executeMigrateAllBtradeSlicesToMonthsCli(argv);
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
  runMigrateAllBtradeSlicesToMonthsConnected(process.argv.slice(2)).catch(
    (err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(message);
      process.exitCode = 1;
    },
  );
}
