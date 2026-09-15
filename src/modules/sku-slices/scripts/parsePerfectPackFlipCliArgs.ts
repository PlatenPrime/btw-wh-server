import { dateStringSchema } from "../../sku-reporting/schemas/dateSchema.js";

export type PerfectPackFlipCliArgs = {
  from?: Date;
  to?: Date;
  apply: boolean;
  konkName?: string;
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

export function parsePerfectPackFlipCliArgs(argv: string[]): PerfectPackFlipCliArgs {
  let from: Date | undefined;
  let to: Date | undefined;
  let apply = false;
  let konkName: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--from") {
      from = parseYmd("--from", readFlagValue(argv, i, "--from"));
      i += 1;
      continue;
    }
    if (arg === "--to") {
      to = parseYmd("--to", readFlagValue(argv, i, "--to"));
      i += 1;
      continue;
    }
    if (arg === "--konk") {
      const value = readFlagValue(argv, i, "--konk");
      if (!value.trim()) {
        throw new Error("--konk requires a name");
      }
      konkName = value.trim();
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if ((from && !to) || (!from && to)) {
    throw new Error("Specify both --from and --to, or neither");
  }
  if (from && to && from.getTime() > to.getTime()) {
    throw new Error("--from must be <= --to");
  }

  return { from, to, apply, ...(konkName ? { konkName } : {}) };
}
