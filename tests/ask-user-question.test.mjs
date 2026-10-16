import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { stripVTControlCharacters } from "node:util";

// Use the installed host's loader and TUI, without adding project dependencies.
assert(process.env.PI_PACKAGE_DIR, "Set PI_PACKAGE_DIR to the installed @earendil-works/pi-coding-agent directory");
const { loadExtensions } = await import(pathToFileURL(join(process.env.PI_PACKAGE_DIR, "dist/core/extensions/loader.js")));
const { visibleWidth } = await import(pathToFileURL(join(process.env.PI_PACKAGE_DIR, "../pi-tui/dist/index.js")));
const cwd = fileURLToPath(new URL("../", import.meta.url));
const loaded = await loadExtensions([join(cwd, "extensions/ask-user-question.ts")], cwd);
assert.deepEqual(loaded.errors, []);
const tool = loaded.extensions[0].tools.get("ask_user_question").definition;
const theme = { fg: (_color, text) => text, bold: (text) => `\u001b[1m${text}\u001b[22m` };
const up = "\u001b[A", down = "\u001b[B", enter = "\r", escape = "\u001b";

async function ask(params, interact) {
	return tool.execute("test", { question: "Choose", ...params }, undefined, undefined, {
		mode: "tui",
		ui: {
			custom: async (factory) => {
				let result;
				const component = await factory({ requestRender() {} }, theme, {}, (answer) => { result = answer; });
				interact(component, () => result);
				assert.notEqual(result, undefined, "Interaction must submit or cancel");
				return result;
			},
		},
	});
}

function press(component, ...keys) {
	for (const key of keys) component.handleInput(key);
}

test("single-select remains the default and returns backward-compatible answer", async () => {
	const result = await ask({ options: ["A", "B"], recommended: "B" }, (ui) => {
		assert(ui.render(100).join("\n").includes("\u001b[1mB (recommended)"));
		press(ui, down, enter);
	});
	assert.equal(result.content[0].text, "User answered: B");
	assert.deepEqual(result.details, { question: "Choose", answer: "B", answers: ["B"], wasCustom: false });
});

test("filters typed-answer placeholders without hiding substantive custom options", async () => {
	const placeholders = ["Custom answer", "CUSTOM RESPONSE.", "Type your answer", "The user will type an answer", "I'll type my own answer", "Other (please specify)", "Custom answer — I'll type it", "Free text answer", "Something else (I'll specify)", "Let me write my answer", " "];
	const result = await ask({ options: [...placeholders, "Use a custom API", "Write an answer parser", "Custom answer validation"], recommended: "Custom answer" }, (ui) => {
		const rendered = ui.render(200).join("\n");
		assert(rendered.includes("1. Use a custom API"));
		assert(rendered.includes("2. Write an answer parser"));
		assert(rendered.includes("3. Custom answer validation"));
		assert(rendered.includes("4. Type your answer"));
		assert.equal(rendered.match(/Type your answer/g)?.length, 1);
		assert(!rendered.includes("recommended"));
		press(ui, enter);
	});
	assert.deepEqual(result.details.answers, ["Use a custom API"]);
});

test("Space enables multi-select even when initially disabled and preserves typed input", async () => {
	for (const multiSelect of [undefined, false]) {
		const result = await ask({ options: ["A", "B"], multiSelect }, (ui, current) => {
			assert(ui.render(100).join("\n").includes("Space"));
			press(ui, " ");
			assert.equal(current(), undefined);
			assert(ui.render(100).join("\n").includes("1. [x] A"));
			press(ui, down, " ", " ", " ", down, enter, "Additional answer", enter, enter);
		});
		assert.deepEqual(result.details.answers, ["A", "B", "Additional answer"]);
		assert.equal(result.details.wasCustom, true);
		assert.equal(result.content[0].text, "User answered:\n- A\n- B\n- Additional answer");
	}
});

test("long options and keyboard hints wrap without losing text on resize", async () => {
	const label = "An option with enough words to span several lines and preserve the final sentinel";
	const wideLabel = "日本語の選択肢 with Unicode and a_very_long_unbroken_identifier_ending_here";
	await ask({ options: [label, wideLabel], recommended: label }, (ui) => {
		for (const width of [12, 24, 60, 24]) {
			const lines = ui.render(width);
			assert(lines.every((line) => visibleWidth(line) <= width));
			const text = stripVTControlCharacters(lines.join("\n")).replace(/\s/g, "");
			for (const expected of [label, wideLabel, "(recommended)", "Esc to cancel"])
				assert(text.includes(expected.replace(/\s/g, "")), `${width}: ${expected}`);
		}
		const lines = ui.render(24).map(stripVTControlCharacters);
		const first = lines.findIndex((line) => line.startsWith("> 1. "));
		assert(first >= 0);
		assert(lines[first + 1].startsWith("     "), "Continuation aligns with option text");
		press(ui, " ");
		const multi = stripVTControlCharacters(ui.render(24).join("\n")).replace(/\s/g, "");
		assert(multi.includes(label.replace(/\s/g, "")));
		assert(multi.includes("Esc cancel".replace(/\s/g, "")));
		press(ui, escape);
	});
});

test("multi-select toggles, rejects empty submission, and returns choices in menu order", async () => {
	const result = await ask({ options: ["A", "B", "C"], multiSelect: true }, (ui, current) => {
		press(ui, enter);
		assert.equal(current(), undefined);
		press(ui, down, " ", up, " ", " ", " ");
		assert(ui.render(100).join("\n").includes("1. [x] A"));
		press(ui, enter);
	});
	assert.deepEqual(result.details.answers, ["A", "B"]);
	assert.equal(result.details.answer, "A; B");
	assert.equal(result.details.wasCustom, false);
	assert.equal(result.content[0].text, "User answered:\n- A\n- B");
});

test("multi-select combines checked choices with typed input; editing can be cancelled or cleared", async () => {
	const result = await ask({ options: ["A", "B"], multiSelect: true }, (ui) => {
		press(ui, " ", down, down, enter, "My own answer", enter);
		assert(ui.render(100).join("\n").includes("Typed answer: My own answer"));
		press(ui, down, down, enter, " discarded", escape, up, up, enter);
	});
	assert.deepEqual(result.details.answers, ["A", "My own answer"]);
	assert.equal(result.details.wasCustom, true);

	const cleared = await ask({ options: ["A"], multiSelect: true }, (ui) => {
		press(ui, " ", down, enter, "Custom", enter, down, enter, "\u0001", "\u000b", enter, enter);
	});
	assert.deepEqual(cleared.details.answers, ["A"]);
	assert.equal(cleared.details.wasCustom, false);
});

test("custom-only multi-select can submit without checked choices", async () => {
	const result = await ask({ options: ["A"], multiSelect: true }, (ui) => {
		press(ui, down, enter, "Typed only", enter, enter);
	});
	assert.deepEqual(result.details.answers, ["Typed only"]);
	assert.equal(result.details.wasCustom, true);
});

test("all-filtered and absent options start in typed-input mode", async () => {
	for (const multiSelect of [false, true]) {
		for (const options of [undefined, ["Custom answer", "Type your answer"]]) {
			const result = await ask({ options, multiSelect }, (ui, current) => {
				press(ui, enter);
				assert.equal(current(), undefined);
				press(ui, "  Free answer  ", enter);
			});
			assert.deepEqual(result.details.answers, ["Free answer"]);
			assert.equal(result.details.wasCustom, true);
		}
	}
});

test("cancellation and non-interactive mode preserve empty-answer semantics", async () => {
	const cancelled = await ask({ options: ["A"], multiSelect: true }, (ui) => press(ui, " ", escape));
	assert.deepEqual(cancelled.details, { question: "Choose", answer: null, answers: [], wasCustom: false, cancelled: true });
	const unavailable = await tool.execute("test", { question: "Choose" }, undefined, undefined, { mode: "print" });
	assert.equal(unavailable.details.answer, null);
	assert.deepEqual(unavailable.details.answers, []);
	assert.equal(unavailable.details.cancelled, true);
});

test("rendering fits narrow terminal widths", async () => {
	await ask({ options: ["Wide 日本語 option"], multiSelect: true }, (ui) => {
		for (const width of [1, 8, 40]) assert(ui.render(width).every((line) => visibleWidth(line) <= width));
		press(ui, down, enter);
		for (const width of [1, 8, 40]) assert(ui.render(width).every((line) => visibleWidth(line) <= width));
		press(ui, escape, escape);
	});
});
