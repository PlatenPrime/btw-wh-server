import { describe, expect, it } from "vitest";
import { detectAdmToolsAckProtocol, evalAdmToolsAckExpression, extractAdmToolsAckExpression, isAdmToolsChallengeHtml, resolveAdmToolsAckFromHtml, } from "../admToolsChallenge.js";
const SAMPLE_FORM_CHALLENGE_HTML = `<!DOCTYPE html>
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
/** Актуальный HTML challenge adm.tools (AIR, 2026-08). */
const SAMPLE_JSON_CHALLENGE_HTML = `<!DOCTYPE html>
<html lang="uk">
<head>
    <title>Захищена сторінка</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
<div id="container">
    <div class="loader"><div></div></div>
    <div class="link">
        <div>
            <div >захищено  <a href="https://adm.tools" target="_blank">adm.tools</a></div>
            <div class="link-info">85.114.197.55 — <span class="time">2026-08-10T03:34:03.576Z</span></div>
        </div>
    </div>
</div>
<script>
    document.querySelector('.time').innerText = new Date().toLocaleString();
	function run() {
		var cookieEnabled = navigator.cookieEnabled;
		var xhr = new XMLHttpRequest();
		xhr.open('POST', '');
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
		xhr.send(JSON.stringify({__ack: eval('10-93-92+33')}));
		xhr.onloadend = function (event) {
			if (event.target.status !== 200) {
				return;
			}
			location.reload()
		}
	}
	run();
</script>
</body>`;
describe("isAdmToolsChallengeHtml", () => {
    it("true для adm.tools + ___ack (legacy form)", () => {
        expect(isAdmToolsChallengeHtml(SAMPLE_FORM_CHALLENGE_HTML)).toBe(true);
    });
    it("true для adm.tools + __ack (json)", () => {
        expect(isAdmToolsChallengeHtml(SAMPLE_JSON_CHALLENGE_HTML)).toBe(true);
    });
    it("false без ack-поля", () => {
        expect(isAdmToolsChallengeHtml("<html>adm.tools Захищена сторінка</html>")).toBe(false);
    });
    it("false на пустом", () => {
        expect(isAdmToolsChallengeHtml("")).toBe(false);
    });
});
describe("detectAdmToolsAckProtocol", () => {
    it("json-__ack для JSON.stringify", () => {
        expect(detectAdmToolsAckProtocol(SAMPLE_JSON_CHALLENGE_HTML)).toBe("json-__ack");
    });
    it("form-___ack для form.append", () => {
        expect(detectAdmToolsAckProtocol(SAMPLE_FORM_CHALLENGE_HTML)).toBe("form-___ack");
    });
    it("undefined без паттерна", () => {
        expect(detectAdmToolsAckProtocol("<html>adm.tools __ack</html>")).toBeUndefined();
    });
});
describe("extractAdmToolsAckExpression", () => {
    it("достаёт выражение из form.append", () => {
        expect(extractAdmToolsAckExpression(SAMPLE_FORM_CHALLENGE_HTML)).toBe("6-27+26+56");
    });
    it("достаёт выражение из JSON.stringify({__ack: eval})", () => {
        expect(extractAdmToolsAckExpression(SAMPLE_JSON_CHALLENGE_HTML)).toBe("10-93-92+33");
    });
    it("undefined без паттерна", () => {
        expect(extractAdmToolsAckExpression("<html>__ack</html>")).toBeUndefined();
    });
});
describe("evalAdmToolsAckExpression", () => {
    it("считает арифметику как в браузере", () => {
        expect(evalAdmToolsAckExpression("6-27+26+56")).toBe(61);
    });
    it("считает отрицательный результат json-challenge", () => {
        expect(evalAdmToolsAckExpression("10-93-92+33")).toBe(-142);
    });
    it("кидает на небезопасное выражение", () => {
        expect(() => evalAdmToolsAckExpression("process.exit(1)")).toThrow(/Unsafe/);
    });
    it("кидает на пустое", () => {
        expect(() => evalAdmToolsAckExpression("   ")).toThrow(/Unsafe/);
    });
});
describe("resolveAdmToolsAckFromHtml", () => {
    it("form HTML → ack number", () => {
        expect(resolveAdmToolsAckFromHtml(SAMPLE_FORM_CHALLENGE_HTML)).toBe(61);
    });
    it("json HTML → ack number", () => {
        expect(resolveAdmToolsAckFromHtml(SAMPLE_JSON_CHALLENGE_HTML)).toBe(-142);
    });
    it("кидает без выражения", () => {
        expect(() => resolveAdmToolsAckFromHtml("<html>adm.tools __ack</html>")).toThrow(/missing ack/);
    });
});
