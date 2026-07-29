/**
 * Детект и разбор JS-challenge страницы adm.tools («Захищена сторінка»).
 * Браузер: eval(expr) → POST ___ack → reload. Impit повторяет без JS-runtime.
 */

const ACK_APPEND_RE =
  /form\.append\(\s*['"]___ack['"]\s*,\s*eval\(\s*['"]([^'"]+)['"]\s*\)\s*\)/i;

/** Только арифметика — без идентификаторов/вызовов. */
const SAFE_ARITH_RE = /^[\d+\-*/().\s]+$/;

/**
 * HTML заглушки adm.tools (challenge / protect page).
 */
export function isAdmToolsChallengeHtml(html: string): boolean {
  if (!html) {
    return false;
  }
  const hasAck = html.includes("___ack");
  const hasVendor =
    html.includes("adm.tools") || html.includes("Захищена сторінка");
  return hasAck && hasVendor;
}

/**
 * Достаёт выражение из `form.append('___ack', eval('...'))`.
 */
export function extractAdmToolsAckExpression(
  html: string
): string | undefined {
  const match = html.match(ACK_APPEND_RE);
  const expr = match?.[1]?.trim();
  return expr || undefined;
}

/**
 * Безопасно вычисляет арифметическое выражение challenge (как `eval` в браузере).
 * @throws Error при небезопасном/невалидном выражении
 */
export function evalAdmToolsAckExpression(expression: string): number {
  const trimmed = expression.trim();
  if (!trimmed || !SAFE_ARITH_RE.test(trimmed)) {
    throw new Error(
      `Unsafe or empty adm.tools ___ack expression: ${JSON.stringify(expression)}`
    );
  }
  let result: unknown;
  try {
    result = Function(`"use strict"; return (${trimmed});`)();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to eval adm.tools ___ack expression: ${msg}`
    );
  }
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error(
      `adm.tools ___ack did not evaluate to a finite number: ${String(result)}`
    );
  }
  return result;
}

/**
 * Из HTML challenge → числовое значение ___ack.
 * @throws Error если страница без выражения или expr битый
 */
export function resolveAdmToolsAckFromHtml(html: string): number {
  const expression = extractAdmToolsAckExpression(html);
  if (!expression) {
    throw new Error("adm.tools challenge HTML missing ___ack eval expression");
  }
  return evalAdmToolsAckExpression(expression);
}
