import { browserGetBuffer } from "../../../browser/utils/browserRequest.js";
import { getSharikHttpProxyUrl } from "../../../browser/sharik/utils/getSharikHttpProxyUrl.js";
import {
  buildSharikArtImageUrl,
  type SharikArtImageSize,
} from "../build-sharik-art-image-url/buildSharikArtImageUrl.js";

export class SharikArtImageNotFoundError extends Error {
  readonly code = "SHARIK_ART_IMAGE_NOT_FOUND" as const;

  constructor(message = "Sharik art image not found") {
    super(message);
    this.name = "SharikArtImageNotFoundError";
  }
}

export class SharikArtImageUpstreamError extends Error {
  readonly code = "SHARIK_ART_IMAGE_UPSTREAM" as const;

  constructor(message = "Sharik art image upstream error") {
    super(message);
    this.name = "SharikArtImageUpstreamError";
  }
}

export type FetchedSharikArtImage = {
  buffer: Buffer;
  contentType: string;
};

function isImageContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith("image/");
}

/**
 * Тянет JPEG артикула с sharik через HTTP-прокси.
 * Успех только при HTTP 200 + Content-Type image/* + непустое тело.
 */
export async function fetchSharikArtImage(
  artikul: string,
  size: SharikArtImageSize
): Promise<FetchedSharikArtImage> {
  const url = buildSharikArtImageUrl(artikul, size);

  let result;
  try {
    result = await browserGetBuffer(url, {
      proxyUrl: getSharikHttpProxyUrl(),
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    throw new SharikArtImageUpstreamError(details);
  }

  if (result.status >= 500) {
    throw new SharikArtImageUpstreamError(
      `Upstream HTTP ${result.status} for sharik art image`
    );
  }

  if (
    result.status !== 200 ||
    !isImageContentType(result.contentType) ||
    result.buffer.length === 0
  ) {
    throw new SharikArtImageNotFoundError();
  }

  return {
    buffer: result.buffer,
    contentType: result.contentType,
  };
}
