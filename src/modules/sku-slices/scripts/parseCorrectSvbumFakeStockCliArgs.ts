import { dateStringSchema } from "../../sku-reporting/schemas/dateSchema.js";
import { SVBUM_FAKE_STOCK_CRON_DAYS_BACK } from "../../slices/config/svbumFakeStockThreshold.js";

export type CorrectSvbumFakeStockCliArgs = {
  daysBack: number;
  apply: boolean;
  asOf?: Date;
  lookbackDays?: number;
};

function readFlagValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parseYmd(flag: string, raw: string): Date {
  const parsed = dateStringSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`${flag} must be YYYY-MM-DD`);
  }
  return parsed.data;
}

function parsePositiveInt(flag: string, raw: string, min: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) {
    throw new Error(`${flag} must be an integer >= ${min}`);
  }
  return n;
}

export function parseCorrectSvbumFakeStockCliArgs(
  argv: string[]
): CorrectSvbumFakeStockCliArgs {
  let daysBack = SVBUM_FAKE_STOCK_CRON_DAYS_BACK;
  let apply = false;
  let asOf: Date | undefined;
  let lookbackDays: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--days-back") {
      daysBack = parsePositiveInt(
        "--days-back",
        readFlagValue(argv, i, "--days-back"),
        1
      );
      i += 1;
      continue;
    }
    if (arg === "--as-of") {
      asOf = parseYmd("--as-of", readFlagValue(argv, i, "--as-of"));
      i += 1;
      continue;
    }
    if (arg === "--lookback-days") {
      lookbackDays = parsePositiveInt(
        "--lookback-days",
        readFlagValue(argv, i, "--lookback-days"),
        0
      );
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    daysBack,
    apply,
    ...(asOf ? { asOf } : {}),
    ...(lookbackDays !== undefined ? { lookbackDays } : {}),
  };
}
