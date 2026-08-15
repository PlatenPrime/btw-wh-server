/** Базовый URL сайта Grabo для резолва относительных ссылок. */
export const GRABO_BASE_URL = "https://www.grabo-balloons.com";

/** Английская HTML-карта сайта с деревом категорий Products. */
export const GRABO_SITEMAP_URL = `${GRABO_BASE_URL}/en/sitemap`;

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
