import { dateStringSchema } from "../../sku-reporting/schemas/dateSchema.js";

export type MaterializeSkuSliceMonthsCliArgs = {
  daysBack: number;
  apply: boolean;
  asOf?: Date;
  konkName?: string;
};

const DEFAULT_DAYS_BACK = 30;

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

export function parseMaterializeSkuSliceMonthsCliArgs(
  argv: string[],
): MaterializeSkuSliceMonthsCliArgs {
  let daysBack = DEFAULT_DAYS_BACK;
  let apply = false;
  let asOf: Date | undefined;
  let konkName: string | undefined;

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
        1,
      );
      i += 1;
      continue;
    }
    if (arg === "--as-of") {
      asOf = parseYmd("--as-of", readFlagValue(argv, i, "--as-of"));
      i += 1;
      continue;
    }
    if (arg === "--konk") {
      const value = readFlagValue(argv, i, "--konk").trim();
      if (!value) {
        throw new Error("--konk requires a non-empty value");
      }
      konkName = value;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    daysBack,
    apply,
    ...(asOf ? { asOf } : {}),
    ...(konkName ? { konkName } : {}),
  };
}
