export type RescaleDojdevikPackCliArgs = {
  apply: boolean;
  limit?: number;
  productId?: string;
  jitterMinMs?: number;
  jitterMaxMs?: number;
};

function readFlagValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parseNonNegativeIntFlag(flag: string, raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || String(n) !== raw.trim()) {
    throw new Error(`${flag} must be a non-negative integer`);
  }
  return n;
}

function parsePositiveIntFlag(flag: string, raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || String(n) !== raw.trim()) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return n;
}

export function parseRescaleDojdevikPackCliArgs(argv: string[]): RescaleDojdevikPackCliArgs {
  let apply = false;
  let limit: number | undefined;
  let productId: string | undefined;
  let jitterMinMs: number | undefined;
  let jitterMaxMs: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--limit") {
      limit = parsePositiveIntFlag("--limit", readFlagValue(argv, i, "--limit"));
      i += 1;
      continue;
    }
    if (arg === "--productId") {
      const value = readFlagValue(argv, i, "--productId").trim();
      if (!value) {
        throw new Error("--productId requires a value");
      }
      productId = value;
      i += 1;
      continue;
    }
    if (arg === "--jitter-min-ms") {
      jitterMinMs = parseNonNegativeIntFlag(
        "--jitter-min-ms",
        readFlagValue(argv, i, "--jitter-min-ms"),
      );
      i += 1;
      continue;
    }
    if (arg === "--jitter-max-ms") {
      jitterMaxMs = parseNonNegativeIntFlag(
        "--jitter-max-ms",
        readFlagValue(argv, i, "--jitter-max-ms"),
      );
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if ((jitterMinMs !== undefined) !== (jitterMaxMs !== undefined)) {
    throw new Error("Specify both --jitter-min-ms and --jitter-max-ms, or neither");
  }
  if (jitterMinMs !== undefined && jitterMaxMs !== undefined && jitterMinMs > jitterMaxMs) {
    throw new Error("--jitter-min-ms must be <= --jitter-max-ms");
  }

  return {
    apply,
    ...(limit !== undefined ? { limit } : {}),
    ...(productId ? { productId } : {}),
    ...(jitterMinMs !== undefined ? { jitterMinMs } : {}),
    ...(jitterMaxMs !== undefined ? { jitterMaxMs } : {}),
  };
}
