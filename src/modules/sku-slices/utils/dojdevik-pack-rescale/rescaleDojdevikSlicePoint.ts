import { toMoney } from "../../../browser/utils/to-money/toMoney.js";
import type { ISkuSliceDataItem } from "../../models/skuSliceTypes.js";

/**
 * Переводит точку среза с legacy packSize на актуальный.
 * stock' = stock * packNew / packOld; price' = price * packOld / packNew.
 * `-1` и невалидные pack — без изменений.
 */
export function rescaleDojdevikSlicePoint(
  point: ISkuSliceDataItem,
  packOld: number,
  packNew: number,
): ISkuSliceDataItem {
  if (point.stock === -1 || point.price === -1) {
    return point;
  }
  if (
    !Number.isFinite(packOld) ||
    !Number.isFinite(packNew) ||
    packOld < 1 ||
    packNew < 1 ||
    packOld === packNew
  ) {
    return point;
  }
  if (!Number.isFinite(point.stock) || !Number.isFinite(point.price)) {
    return point;
  }

  return {
    stock: Math.round((point.stock * packNew) / packOld),
    price: toMoney((point.price * packOld) / packNew),
  };
}
