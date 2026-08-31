import {
  filterProductsForSliceRotation,
  type SliceRotationInfo,
} from "../../slices/utils/sliceRotation.js";

export type SlicedSkuWithProductId = {
  _id: { toString(): string };
  productId?: string;
};

export function filterSlicedSkusForRotation<T extends SlicedSkuWithProductId>(
  skus: T[],
  sliceDate: Date,
  konkName: string
): { skus: T[]; rotation: SliceRotationInfo | null } {
  const { filtered, rotation } = filterProductsForSliceRotation(
    skus,
    sliceDate,
    konkName
  );
  return { skus: filtered, rotation };
}
