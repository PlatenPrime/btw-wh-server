import { describe, expect, it } from "vitest";
import {
  evalAdmToolsAckExpression,
  extractAdmToolsAckExpression,
  isAdmToolsChallengeHtml,
  resolveAdmToolsAckFromHtml,
} from "../admToolsChallenge.js";

const SAMPLE_CHALLENGE_HTML = `<!DOCTYPE html>
<html lang="uk">
<head>
    <title>Захищена сторінка</title>
</head>
<body>
<div>захищено  <a href="https://adm.tools" target="_blank">adm.tools</a></div>
<script>
	function run() {
		var form = new FormData();
		form.append('___ack', eval('6-27+26+56'));
		xhr.open('POST', '');
		xhr.send(form);
	}
	run();
</script>
</body>`;

describe("isAdmToolsChallengeHtml", () => {
  it("true для adm.tools + ___ack", () => {
    expect(isAdmToolsChallengeHtml(SAMPLE_CHALLENGE_HTML)).toBe(true);
  });

  it("false без ___ack", () => {
    expect(
      isAdmToolsChallengeHtml("<html>adm.tools Захищена сторінка</html>")
    ).toBe(false);
  });

  it("false на пустом", () => {
    expect(isAdmToolsChallengeHtml("")).toBe(false);
  });
});

describe("extractAdmToolsAckExpression", () => {
  it("достаёт выражение из form.append", () => {
    expect(extractAdmToolsAckExpression(SAMPLE_CHALLENGE_HTML)).toBe(
      "6-27+26+56"
    );
  });

  it("undefined без паттерна", () => {
    expect(extractAdmToolsAckExpression("<html>___ack</html>")).toBeUndefined();
  });
});

describe("evalAdmToolsAckExpression", () => {
  it("считает арифметику как в браузере", () => {
    expect(evalAdmToolsAckExpression("6-27+26+56")).toBe(61);
  });

  it("кидает на небезопасное выражение", () => {
    expect(() => evalAdmToolsAckExpression("process.exit(1)")).toThrow(
      /Unsafe/
    );
  });

  it("кидает на пустое", () => {
    expect(() => evalAdmToolsAckExpression("   ")).toThrow(/Unsafe/);
  });
});

describe("resolveAdmToolsAckFromHtml", () => {
  it("HTML → ack number", () => {
    expect(resolveAdmToolsAckFromHtml(SAMPLE_CHALLENGE_HTML)).toBe(61);
  });

  it("кидает без выражения", () => {
    expect(() =>
      resolveAdmToolsAckFromHtml("<html>adm.tools ___ack</html>")
    ).toThrow(/missing ___ack/);
  });
});
