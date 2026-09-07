export const BALUN_PROBE_QUANTITY = 999_999;

export const ADD_PRODUCT_TO_CART_QUERY = `
  mutation AddProductToCart($payload: CartAddProductInput!, $viewerSource: ViewerSource!) {
    cartAddProduct(payload: $payload) {
      ... on CartAddProductSuccess {
        __typename
        self {
          cartList {
            carts(viewerSource: $viewerSource) {
              id
              items {
                productId
                price {
                  unit {
                    selling
                  }
                }
              }
            }
          }
        }
      }
      ... on AuthenticationError {
        __typename
        description
      }
      ... on ProductAlreadyInCartError {
        __typename
        description
        error_name
      }
      ... on CartItemsLimitReachedError {
        __typename
        description
        error_name
      }
      ... on ProductNotOrderableError {
        __typename
        description
        error_name
      }
      ... on CantAddDeletedProductToCartErrorType {
        __typename
        description
        error_name
      }
      ... on CantAddUnknownProductToCart {
        __typename
        description
        error_name
      }
    }
  }
`;

export const CART_CHANGE_PRODUCT_QUANTITY_QUERY = `
  mutation CartChangeProductQuantity($payload: CartChangeProductQuantityInput!, $source: ViewerSource!, $cartId: ID!) {
    cartChangeProductQuantity(payload: $payload) {
      ... on RequestedQuantitySet {
        __typename
      }
      ... on RequestedQuantityRecalculatedType {
        __typename
        recalculatedReason: reason
        recalculatedQuantity
        self {
          cartList {
            cart(id: $cartId, viewerSource: $source) {
              items {
                productId
                price {
                  unit {
                    selling
                  }
                }
              }
            }
          }
        }
      }
      ... on RequestedQuantityInvalidQuantityError {
        __typename
        description
        error_name
      }
      ... on CartChangeProductQuantityError {
        __typename
        description
        error_name
      }
      __typename
    }
  }
`;
