import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../../modules/browser/utils/playwrightBrowser.js", () => ({
    closePlaywrightBrowser: vi.fn(async () => undefined),
}));
import { closePlaywrightBrowser } from "../../modules/browser/utils/playwrightBrowser.js";
import { registerProcessHandlers, resetShutdownStateForTests, } from "../registerProcessHandlers.js";
describe("registerProcessHandlers shutdown", () => {
    afterEach(() => {
        resetShutdownStateForTests();
        vi.mocked(closePlaywrightBrowser).mockClear();
        process.removeAllListeners("SIGINT");
        process.removeAllListeners("SIGTERM");
    });
    it("SIGINT вызывает closePlaywrightBrowser и process.exit(0)", async () => {
        const log = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            fatal: vi.fn(),
        };
        const exitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation((() => undefined));
        registerProcessHandlers(log);
        process.emit("SIGINT");
        await vi.waitFor(() => {
            expect(closePlaywrightBrowser).toHaveBeenCalled();
            expect(exitSpy).toHaveBeenCalledWith(0);
        });
        exitSpy.mockRestore();
    });
});
