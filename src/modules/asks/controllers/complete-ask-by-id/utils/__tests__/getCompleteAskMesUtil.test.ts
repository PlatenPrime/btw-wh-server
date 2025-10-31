import { describe, expect, it } from "vitest";
import { getCompleteAskMesUtil } from "../getCompleteAskMesUtil.js";

describe("getCompleteAskMesUtil", () => {
  it("формирует корректное сообщение для автора заявки", () => {
    const msg = getCompleteAskMesUtil({
      solverName: "Solver",
      ask: {
        artikul: "ART-42",
        nameukr: "Товар",
        quant: 7,
      } as any,
    });

    expect(msg).toContain("✅ Ваш запит виконано!");
    expect(msg).toContain("ART-42");
    expect(msg).toContain("Товар");
    expect(msg).toContain("7");
    expect(msg).toContain("Виконавець: Solver");
  });
});


