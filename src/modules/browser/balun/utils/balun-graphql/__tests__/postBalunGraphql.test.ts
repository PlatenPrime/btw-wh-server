import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import {
  BALUN_ORIGIN,
  buildBalunGraphqlUrl,
  postBalunGraphql,
} from "../postBalunGraphql.js";

describe("buildBalunGraphqlUrl", () => {
  it("builds company-site GraphQL URL with operation name", () => {
    expect(buildBalunGraphqlUrl("AddProductToCart")).toBe(
      `${BALUN_ORIGIN}/bfg/graphql?operation_name=AddProductToCart&source=COMPANY_SITE`
    );
  });
});

describe("postBalunGraphql", () => {
  it("posts JSON, sends csrf/cookie, merges Set-Cookie", async () => {
    const post = vi.fn().mockResolvedValue({
      status: 200,
      data: { data: { ok: true } },
      headers: { "set-cookie": ["shopping-cart=new; Path=/"] },
    });
    const client = { post } as unknown as AxiosInstance;

    const result = await postBalunGraphql(client, {
      operationName: "AddProductToCart",
      query: "mutation X { x }",
      variables: { payload: { productId: "1" } },
      productUrl: "https://balun.com.ua/ua/p1-x.html",
      cookieHeader: "csrf_token_company_site=abc; cid=1",
      csrfToken: "csrf-from-page",
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ data: { ok: true } });
    expect(result.cookieHeader).toContain("shopping-cart=new");
    expect(result.cookieHeader).toContain("csrf_token_company_site=abc");
    expect(post).toHaveBeenCalledWith(
      `${BALUN_ORIGIN}/bfg/graphql?operation_name=AddProductToCart&source=COMPANY_SITE`,
      {
        operationName: "AddProductToCart",
        variables: { payload: { productId: "1" } },
        query: "mutation X { x }",
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "csrf_token_company_site=abc; cid=1",
          "x-csrftoken": "csrf-from-page",
          Referer: "https://balun.com.ua/ua/p1-x.html",
          Origin: BALUN_ORIGIN,
          "X-Language": "uk",
          "X-Requested-With": "XMLHttpRequest",
        }),
      })
    );
  });

  it("omits csrf and cookie headers when empty", async () => {
    const post = vi.fn().mockResolvedValue({
      status: 0,
      data: "",
      headers: {},
    });
    const client = { post } as unknown as AxiosInstance;

    const result = await postBalunGraphql(client, {
      operationName: "CartChangeProductQuantity",
      query: "mutation Y { y }",
      variables: {},
      productUrl: "https://balun.com.ua/p1.html",
      cookieHeader: "",
    });

    expect(result.status).toBe(0);
    expect(result.cookieHeader).toBe("");
    const headers = post.mock.calls[0]?.[2]?.headers as Record<string, string>;
    expect(headers.Cookie).toBeUndefined();
    expect(headers["x-csrftoken"]).toBeUndefined();
  });
});
