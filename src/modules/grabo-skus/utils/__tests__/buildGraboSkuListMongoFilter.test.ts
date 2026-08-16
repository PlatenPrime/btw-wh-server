import { describe, expect, it } from "vitest";
import { buildGraboSkuListMongoFilter } from "../buildGraboSkuListMongoFilter.js";

describe("buildGraboSkuListMongoFilter", () => {
  it("keeps false booleans in the filter", () => {
    expect(
      buildGraboSkuListMongoFilter({
        isOnSite: false,
        isNewProduct: false,
      })
    ).toEqual({
      isOnSite: false,
      isNewProduct: false,
    });
  });

  it("ignores blank search and attribute strings after trim", () => {
    expect(
      buildGraboSkuListMongoFilter({
        search: "  ",
        productId: "",
        color: "   ",
        size: " ",
        material: "",
        gas: "\t",
        language: "",
        gasCapacity: "  ",
        tag: "  ",
      })
    ).toEqual({});
  });

  it("builds search $or on title and productId with escaped regex", () => {
    expect(buildGraboSkuListMongoFilter({ search: "G.1" })).toEqual({
      $or: [
        { title: { $regex: "G\\.1", $options: "i" } },
        { productId: { $regex: "G\\.1", $options: "i" } },
      ],
    });
  });

  it("ANDs exact fields and size option regex", () => {
    expect(
      buildGraboSkuListMongoFilter({
        productId: " G1 ",
        isOnSite: true,
        isNewProduct: false,
        color: " Pink ",
        size: '40"',
        material: "Foil",
        gas: "Helium",
        language: "EN",
        gasCapacity: " air only ",
        tag: " birthday ",
      })
    ).toEqual({
      productId: "G1",
      isOnSite: true,
      isNewProduct: false,
      color: "Pink",
      size: { $regex: '^40"(\\s*/|$)' },
      material: "Foil",
      gas: "Helium",
      language: "EN",
      gasCapacity: "air only",
      tags: "birthday",
    });
  });
});
