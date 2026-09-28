import { logBrowserError } from "../../../utils/browserRequest.js";

export function logPerfectUnavailableOutcome(
  productUrl: string,
  reason: string,
  htmlStatus: number,
  hasProductPageHtml: boolean
): void {
  logBrowserError(
    `Perfect stock unavailable (${reason})`,
    new Error(
      `url=${productUrl} status=${htmlStatus} productPageHtml=${hasProductPageHtml}`
    )
  );
}
