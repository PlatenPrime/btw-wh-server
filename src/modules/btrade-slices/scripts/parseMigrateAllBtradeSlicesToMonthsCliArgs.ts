export type MigrateAllBtradeSlicesToMonthsCliArgs = {
  apply: boolean;
  verify: boolean;
  verifySample: number;
};

function requireValue(argv: string[], i: number, flag: string): string {
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return v;
}

/**
 * CLI: [--apply] [--verify] [--verify-sample N] [--no-verify]
 * Default: dry-run migrate + verify after apply.
 */
export function parseMigrateAllBtradeSlicesToMonthsCliArgs(
  argv: string[],
): MigrateAllBtradeSlicesToMonthsCliArgs {
  let apply = false;
  let verify = true;
  let verifySample = 100;
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
    throw new Error(`Unknown arg: ${arg}`);
  }

  if (!verifyExplicit) {
    verify = true;
  }

  return { apply, verify, verifySample };
}
