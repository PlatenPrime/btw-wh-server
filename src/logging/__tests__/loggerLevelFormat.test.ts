import { Writable } from "node:stream";

import pino from "pino";
import { describe, expect, it } from "vitest";

import { buildLoggerOptions } from "../logger.js";

describe("buildLoggerOptions", () => {
  it("пишет level строкой для Railway structured logs", () => {
    const chunks: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });

    const log = pino({ ...buildLoggerOptions(), level: "error" }, stream);
    log.error("boom");

    const parsed = JSON.parse(chunks[0]!) as { level: string; msg: string };
    expect(parsed.level).toBe("error");
    expect(parsed.msg).toBe("boom");
  });
});
