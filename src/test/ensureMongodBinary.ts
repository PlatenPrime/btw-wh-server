import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MongoBinary } from "mongodb-memory-server";

export const DEFAULT_MONGOD_VERSION = "7.0.14";

type MongodBinaryDownloadOptions = Parameters<typeof MongoBinary.download>[0];

/** MMS typings require all fields; runtime fills defaults in MongoBinaryDownload. */
async function downloadMongodBinary(
  downloadDir: string,
  version: string,
): Promise<string> {
  return MongoBinary.download({ downloadDir, version } as MongodBinaryDownloadOptions);
}

export function getMongodBinaryFileName(version = DEFAULT_MONGOD_VERSION): string {
  return `mongod-x64-win32-${version}.exe`;
}

export function getMongodZipFileName(version = DEFAULT_MONGOD_VERSION): string {
  return `mongodb-windows-x86_64-${version}.zip`;
}

export function getMongodZipEntryPath(version = DEFAULT_MONGOD_VERSION): string {
  return `mongodb-win32-x86_64-windows-${version}/bin/mongod.exe`;
}

export function getMongodBinaryPath(
  downloadDir: string,
  version = DEFAULT_MONGOD_VERSION,
): string {
  return join(downloadDir, getMongodBinaryFileName(version));
}

export function getMongodZipPath(
  downloadDir: string,
  version = DEFAULT_MONGOD_VERSION,
): string {
  return join(downloadDir, getMongodZipFileName(version));
}

export function isRunnableMongodBinary(binaryPath: string): boolean {
  if (!existsSync(binaryPath)) {
    return false;
  }

  const result = spawnSync(binaryPath, ["--version"], {
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
  });

  return result.status === 0;
}

export function extractMongodFromZip(
  zipPath: string,
  binaryPath: string,
  version = DEFAULT_MONGOD_VERSION,
): void {
  const tempDir = mkdtempSync(join(tmpdir(), "btw-mongod-extract-"));

  try {
    const entryPath = getMongodZipEntryPath(version);
    const extractResult = spawnSync(
      "tar",
      ["-xf", zipPath, "-C", tempDir, entryPath],
      { windowsHide: true },
    );

    if (extractResult.status !== 0) {
      throw new Error(
        `Failed to extract mongod from ${zipPath}: ${extractResult.stderr?.toString() ?? "unknown tar error"}`,
      );
    }

    const extractedBinaryPath = join(tempDir, entryPath);
    if (!existsSync(extractedBinaryPath)) {
      throw new Error(
        `Extracted mongod binary is missing at ${extractedBinaryPath}`,
      );
    }

    mkdirSync(join(binaryPath, ".."), { recursive: true });
    if (existsSync(binaryPath)) {
      unlinkSync(binaryPath);
    }

    copyFileSync(extractedBinaryPath, binaryPath);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function repairWindowsMongodBinary(
  downloadDir: string,
  binaryPath: string,
  version: string,
): Promise<void> {
  if (existsSync(binaryPath)) {
    unlinkSync(binaryPath);
  }

  const zipPath = getMongodZipPath(downloadDir, version);
  if (!existsSync(zipPath)) {
    await downloadMongodBinary(downloadDir, version);
  }

  if (!existsSync(zipPath)) {
    throw new Error(
      `MongoDB zip missing at ${zipPath} after download. Check network access to fastdl.mongodb.org.`,
    );
  }

  extractMongodFromZip(zipPath, binaryPath, version);
}

export async function ensureMongodBinary(
  downloadDir: string,
  version = DEFAULT_MONGOD_VERSION,
): Promise<void> {
  mkdirSync(downloadDir, { recursive: true });

  if (process.platform === "win32") {
    const binaryPath = getMongodBinaryPath(downloadDir, version);
    if (isRunnableMongodBinary(binaryPath)) {
      return;
    }

    await repairWindowsMongodBinary(downloadDir, binaryPath, version);

    if (!isRunnableMongodBinary(binaryPath)) {
      const size = existsSync(binaryPath) ? statSync(binaryPath).size : 0;
      throw new Error(
        `MongoDB test binary at ${binaryPath} is not runnable after repair (${size} bytes).`,
      );
    }

    return;
  }

  const binaryPath = await MongoBinary.getPath({ downloadDir, version });
  if (isRunnableMongodBinary(binaryPath)) {
    return;
  }

  await downloadMongodBinary(downloadDir, version);
  const repairedBinaryPath = await MongoBinary.getPath({ downloadDir, version });

  if (!isRunnableMongodBinary(repairedBinaryPath)) {
    throw new Error(
      `MongoDB test binary at ${repairedBinaryPath} is not runnable.`,
    );
  }
}
