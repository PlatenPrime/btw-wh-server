import express from "express";
import { describe, expect, it, vi } from "vitest";

import {
  API_ROUTES,
  getApiRoutePrefixes,
  registerRoutes,
} from "../registerRoutes.js";

describe("registerRoutes", () => {
  it("getApiRoutePrefixes возвращает все path prefix'ы из API_ROUTES", () => {
    const prefixes = getApiRoutePrefixes();

    expect(prefixes).toHaveLength(API_ROUTES.length);
    expect(prefixes).toEqual(API_ROUTES.map(([path]) => path));
  });

  it("включает /api/events среди зарегистрированных prefix'ов", () => {
    expect(getApiRoutePrefixes()).toContain("/api/events");
  });

  it("монтирует каждый prefix через app.use", () => {
    const app = express();
    const useSpy = vi.spyOn(app, "use");

    registerRoutes(app);

    for (const [path, router] of API_ROUTES) {
      expect(useSpy).toHaveBeenCalledWith(path, router);
    }
    expect(useSpy).toHaveBeenCalledTimes(API_ROUTES.length);
  });
});
