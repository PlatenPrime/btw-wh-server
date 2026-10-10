export type MigrateAllSkuSlicesToMonthsCliArgs = {
  apply: boolean;
  verify: boolean;
  verifySample: number;
  konkName?: string;
};

function requireValue(argv: string[], i: number, flag: string): string {
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return v;
}

/**
 * CLI: [--apply] [--verify] [--verify-sample N] [--konk name]
 * Default: dry-run migrate + verify 100 after apply (verify alone ok).
 */
export function parseMigrateAllSkuSlicesToMonthsCliArgs(
  argv: string[],
): MigrateAllSkuSlicesToMonthsCliArgs {
  let apply = false;
  let verify = true;
  let verifySample = 100;
  let konkName: string | undefined;
  let verifyExplicit = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--verify") {
      verify = true;
      verifyExplicit = true;
      continue;
    }
    if (arg === "--no-verify") {
      verify = false;
      verifyExplicit = true;
      continue;
    }
    if (arg === "--verify-sample") {
      const raw = requireValue(argv, i, "--verify-sample");
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error("--verify-sample must be an integer >= 1");
      }
      verifySample = n;
      i += 1;
      continue;
    }
    if (arg === "--konk") {
      const v = requireValue(argv, i, "--konk").trim();
      if (!v) throw new Error("--konk must be non-empty");
      konkName = v;
      i += 1;
      continue;
    }
    throw new Error(`Unknown arg: ${arg}`);
  }

  if (!verifyExplicit) {
    verify = true;
  }

  return {
    apply,
    verify,
    verifySample,
    ...(konkName ? { konkName } : {}),
  };
}
