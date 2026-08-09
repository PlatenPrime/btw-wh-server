/** Базовый URL сайта Grabo для резолва относительных ссылок. */
export const GRABO_BASE_URL = "https://www.grabo-balloons.com";

/**
 * Данные карточки товара Grabo (контракт полей будущего GraboSku).
 * Имена полей — строго camelCase.
 */
export interface GraboSkuData {
  title: string;
  productId: string;
  isNew: boolean;
  color: string;
  size: string;
  material: string;
  gas: string;
  language: string;
  gasCapacity: string;
  tag: string[];
  images: string[];
}
