/** Лимит Telegram Bot API на длину одного sendMessage. */
export const TELEGRAM_MESSAGE_MAX_CHARS = 4096;

/** Пауза между чанками, чтобы не упереться в flood-wait. */
export const TELEGRAM_MESSAGE_CHUNK_DELAY_MS = 500;

const CHUNK_INDEX_PREFIX_RESERVE = 16;

function splitOversizedLine(line: string, maxLen: number): string[] {
  if (line.length <= maxLen) return [line];
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += maxLen) {
    parts.push(line.slice(i, i + maxLen));
  }
  return parts;
}

function packBodies(text: string, bodyLimit: number): string[] {
  const lines = text.split("\n");
  const bodies: string[] = [];
  let current = "";

  for (const line of lines) {
    for (const piece of splitOversizedLine(line, bodyLimit)) {
      if (current.length === 0) {
        current = piece;
        continue;
      }
      const candidate = `${current}\n${piece}`;
      if (candidate.length <= bodyLimit) {
        current = candidate;
        continue;
      }
      bodies.push(current);
      current = piece;
    }
  }
  if (current.length > 0) bodies.push(current);
  return bodies.length > 0 ? bodies : [""];
}

/**
 * Режет текст на чанки ≤ maxLen по переводам строк.
 * Если чанков больше одного, каждый начинается с `(i/n)`.
 */
export function chunkTelegramMessage(
  text: string,
  maxLen: number = TELEGRAM_MESSAGE_MAX_CHARS
): string[] {
  if (!Number.isFinite(maxLen) || maxLen < 1) {
    throw new Error("chunkTelegramMessage: maxLen must be a positive finite number");
  }
  if (text.length <= maxLen) return [text];

  const prefixReserve = Math.min(CHUNK_INDEX_PREFIX_RESERVE, Math.max(1, maxLen - 1));
  const bodyLimit = Math.max(1, maxLen - prefixReserve);
  const bodies = packBodies(text, bodyLimit);
  const total = bodies.length;
  if (total <= 1) {
    const only = bodies[0] ?? "";
    return only.length <= maxLen ? [only] : packBodies(text, maxLen);
  }

  return bodies.map((body, index) => {
    const prefix = `(${index + 1}/${total})\n`;
    const chunk = `${prefix}${body}`;
    return chunk.length <= maxLen ? chunk : chunk.slice(0, maxLen);
  });
}
