/**
 * Минимальный набор полей товара со страницы группы конкурента для создания Sku.
 */
export type GroupBrowserProduct = {
  title: string;
  url: string;
  imageUrl: string;
};

export type FetchGroupProductsInput = {
  groupUrl: string;
  maxPages?: number;
};
