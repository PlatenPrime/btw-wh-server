/**
 * Детект и разбор JS-challenge страницы adm.tools («Захищена сторінка»).
 * Браузер: eval(expr) → POST ack → reload. Impit повторяет без JS-runtime.
 *
 * Поддерживаются два протокола (adm.tools менял формат):
 * - legacy: FormData `form.append('___ack', eval('...'))`
 * - current: JSON `JSON.stringify({__ack: eval('...')})`
 */

/** Legacy FormData field `___ack`. */
const ACK_FORM_APPEND_RE =
  /form\.append\(\s*['"]___ack['"]\s*,\s*eval\(\s*['"]([^'"]+)['"]\s*\)\s*\)/i;

/** Current JSON body `{__ack: eval('...')}`. */
const ACK_JSON_STRINGIFY_RE =
  /JSON\.stringify\(\s*\{\s*__ack\s*:\s*eval\(\s*['"]([^'"]+)['"]\s*\)\s*\}\s*\)/i;

/** Только арифметика — без идентификаторов/вызовов. */
const SAFE_ARITH_RE = /^[\d+\-*/().\s]+$/;

export type AdmToolsAckProtocol = "form-___ack" | "json-__ack";

/**
 * HTML заглушки adm.tools (challenge / protect page).
 * `__ack` матчит и legacy `___ack`, и новый `__ack`.
 */
export function isAdmToolsChallengeHtml(html: string): boolean {
  if (!html) {
    return false;
  }
  const hasAck = html.includes("__ack");
  const hasVendor =
    html.includes("adm.tools") || html.includes("Захищена сторінка");
  return hasAck && hasVendor;
}

/**
 * Какой POST-протокол использует страница challenge.
 * JSON-вариант приоритетнее, если оба паттерна вдруг встретятся.
 */
export function detectAdmToolsAckProtocol(
  html: string
): AdmToolsAckProtocol | undefined {
  if (html.match(ACK_JSON_STRINGIFY_RE)) {
    return "json-__ack";
  }
  if (html.match(ACK_FORM_APPEND_RE)) {
    return "form-___ack";
  }
  return undefined;
}

/**
 * Достаёт арифметическое выражение из eval(...) challenge.
 */
export function extractAdmToolsAckExpression(
  html: string
): string | undefined {
  const jsonMatch = html.match(ACK_JSON_STRINGIFY_RE);
  const jsonExpr = jsonMatch?.[1]?.trim();
  if (jsonExpr) {
    return jsonExpr;
  }
  const formMatch = html.match(ACK_FORM_APPEND_RE);
  const formExpr = formMatch?.[1]?.trim();
  return formExpr || undefined;
}

/**
 * Безопасно вычисляет арифметическое выражение challenge (как `eval` в браузере).
 * @throws Error при небезопасном/невалидном выражении
 */
export function evalAdmToolsAckExpression(expression: string): number {
  const trimmed = expression.trim();
  if (!trimmed || !SAFE_ARITH_RE.test(trimmed)) {
    throw new Error(
      `Unsafe or empty adm.tools ack expression: ${JSON.stringify(expression)}`
    );
  }
  let result: unknown;
  try {
    result = Function(`"use strict"; return (${trimmed});`)();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to eval adm.tools ack expression: ${msg}`);
  }
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error(
      `adm.tools ack did not evaluate to a finite number: ${String(result)}`
    );
  }
  return result;
}

/**
 * Из HTML challenge → числовое значение ack.
 * @throws Error если страница без выражения или expr битый
 */
export function resolveAdmToolsAckFromHtml(html: string): number {
  const expression = extractAdmToolsAckExpression(html);
  if (!expression) {
    throw new Error("adm.tools challenge HTML missing ack eval expression");
  }
  return evalAdmToolsAckExpression(expression);
}
