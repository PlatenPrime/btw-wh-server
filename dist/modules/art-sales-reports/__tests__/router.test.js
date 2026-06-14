import { describe, expect, it } from "vitest";
import router from "../router.js";
describe("art-sales-reports router", () => {
    it("registers expected GET routes", () => {
        const paths = router.stack
            .filter((layer) => layer.route)
            .map((layer) => layer.route.path);
        expect(paths).toContain("/artikul/:artikul/by-date");
        expect(paths).toContain("/artikul/:artikul/range");
    });
});
