import { createLogger } from "../../../../logging/createLogger.js";
import { BROWSER_REQUEST_TIMEOUT_MS } from "../browserRequest.js";
import { isAdmToolsChallengeHtml, resolveAdmToolsAckFromHtml, } from "./admToolsChallenge.js";
const browserLog = createLogger({ module: "browser" });
/**
 * POST `___ack` на тот же URL (как XHR в challenge-странице adm.tools).
 * Cookie jar Impit-клиента должен подхватить Set-Cookie с ответа.
 * @throws Error если HTML не challenge, POST не 200, или expr не парсится
 */
export async function solveAdmToolsChallenge(client, url, challengeHtml, options) {
    if (!isAdmToolsChallengeHtml(challengeHtml)) {
        throw new Error("Not an adm.tools challenge HTML");
    }
    const ack = resolveAdmToolsAckFromHtml(challengeHtml);
    const form = new FormData();
    form.append("___ack", String(ack));
    const timeout = options?.timeoutMs ?? BROWSER_REQUEST_TIMEOUT_MS;
    const init = {
        method: "POST",
        body: form,
        timeout,
        headers: {
            Referer: url,
            ...(options?.headers ?? {}),
        },
    };
    browserLog.info({ context: "adm.tools challenge solve", url, ack }, "adm tools challenge post");
    const postResponse = await client.fetch(url, init);
    if (postResponse.status !== 200) {
        throw new Error(`adm.tools ___ack POST HTTP ${postResponse.status}: ${url}`);
    }
    return { ack, postStatus: postResponse.status };
}
