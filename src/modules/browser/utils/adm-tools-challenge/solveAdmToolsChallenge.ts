import { createLogger } from "../../../../logging/createLogger.js";
import { BROWSER_REQUEST_TIMEOUT_MS } from "../browserRequest.js";
import type { ImpitClientLike, ImpitFetchInit } from "../impitGet.js";
import {
  detectAdmToolsAckProtocol,
  isAdmToolsChallengeHtml,
  resolveAdmToolsAckFromHtml,
  type AdmToolsAckProtocol,
} from "./admToolsChallenge.js";

const browserLog = createLogger({ module: "browser" });

export type SolveAdmToolsChallengeResult = {
  ack: number;
  postStatus: number;
  protocol: AdmToolsAckProtocol;
};

function buildAckPostInit(
  protocol: AdmToolsAckProtocol,
  ack: number,
  url: string,
  timeout: number,
  extraHeaders?: Record<string, string>
): ImpitFetchInit {
  if (protocol === "json-__ack") {
    return {
      method: "POST",
      body: JSON.stringify({ __ack: ack }),
      timeout,
      headers: {
        Referer: url,
        ...(extraHeaders ?? {}),
        "Content-Type": "application/json; charset=UTF-8",
      },
    };
  }

  const form = new FormData();
  form.append("___ack", String(ack));
  return {
    method: "POST",
    body: form,
    timeout,
    headers: {
      Referer: url,
      ...(extraHeaders ?? {}),
    },
  };
}

/**
 * POST ack на тот же URL (как XHR в challenge-странице adm.tools).
 * Поддерживает JSON `__ack` и legacy FormData `___ack`.
 * Cookie jar Impit-клиента должен подхватить Set-Cookie с ответа.
 * @throws Error если HTML не challenge, POST не 200, или expr не парсится
 */
export async function solveAdmToolsChallenge(
  client: ImpitClientLike,
  url: string,
  challengeHtml: string,
  options?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<SolveAdmToolsChallengeResult> {
  if (!isAdmToolsChallengeHtml(challengeHtml)) {
    throw new Error("Not an adm.tools challenge HTML");
  }

  const protocol = detectAdmToolsAckProtocol(challengeHtml);
  if (!protocol) {
    throw new Error("adm.tools challenge HTML missing known ack protocol");
  }

  const ack = resolveAdmToolsAckFromHtml(challengeHtml);
  const timeout = options?.timeoutMs ?? BROWSER_REQUEST_TIMEOUT_MS;
  const init = buildAckPostInit(
    protocol,
    ack,
    url,
    timeout,
    options?.headers
  );

  browserLog.info(
    { context: "adm.tools challenge solve", url, ack, protocol },
    "adm tools challenge post"
  );

  const postResponse = await client.fetch(url, init);
  if (postResponse.status !== 200) {
    throw new Error(
      `adm.tools ${protocol} POST HTTP ${postResponse.status}: ${url}`
    );
  }

  return { ack, postStatus: postResponse.status, protocol };
}
