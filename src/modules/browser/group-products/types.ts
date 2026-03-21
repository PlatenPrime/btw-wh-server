/**
 * Минимальный набор полей товара со страницы группы конкурента для создания Sku.
 */
export type GroupBrowserProduct = {
  title: string;
  url: string;
  imageUrl: string;
  /** Ид товара со страницы конкурента (до склейки с konkName). */
  productId: string;
};

export type FetchGroupProductsInput = {
  groupUrl: string;
  maxPages?: number;
};
