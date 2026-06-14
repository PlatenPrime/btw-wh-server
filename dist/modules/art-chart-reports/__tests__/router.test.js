import { describe, expect, it } from "vitest";
import router from "../router.js";
describe("art-chart-reports router", () => {
    it("registers expected GET routes", () => {
        const paths = router.stack
            .filter((layer) => layer.route)
            .map((layer) => layer.route.path);
        expect(paths).toContain("/artikul/:artikul/stock");
        expect(paths).toContain("/artikul/:artikul/sales");
    });
});
