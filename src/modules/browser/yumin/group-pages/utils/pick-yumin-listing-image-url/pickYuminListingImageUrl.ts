export type YuminListingBaseImage = {
  large_image_url?: string;
  medium_image_url?: string;
  original_image_url?: string;
} | null | undefined;

export function pickYuminListingImageUrl(
  baseImage: YuminListingBaseImage
): string | null {
  const large = baseImage?.large_image_url?.trim();
  if (large) {
    return large;
  }
  const medium = baseImage?.medium_image_url?.trim();
  if (medium) {
    return medium;
  }
  const original = baseImage?.original_image_url?.trim();
  return original || null;
}
