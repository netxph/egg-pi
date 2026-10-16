import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Input, Key, matchesKey, Text, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const AskUserQuestionParams = Type.Object({
	question: Type.String({ description: "The question to ask the user" }),
	options: Type.Optional(Type.Array(Type.String(), { description: "Options the user can choose from" })),
	recommended: Type.Optional(Type.String({ description: "The recommended option; it must match one option exactly" })),
	multiSelect: Type.Optional(Type.Boolean({ description: "Start in multi-select mode (default: false); the user can always enable it with Space" })),
});

interface AnswerDetails {
	question: string;
	answer: string | null;
	answers: string[];
	wasCustom: boolean;
	cancelled?: boolean;
}

// shortcut: English placeholder phrases only; extend when another wording or language is needed.
function isCustomAnswerOption(option: string): boolean {
	const label = option.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.!]+$/, "");
	return /^(?:(?:a |my |your |their |the user's )?(?:own |custom |free[- ]?(?:text|form) )?(?:answer|response)|other|something else)(?:\s*\(.*\))?$/.test(label)
		|| /^(?:(?:i|you|the user)\s+(?:will |can |would like to |prefer to |want to )?|i'll\s+|let me\s+)?(?:type|write|enter|provide|specify)\s+(?:(?:a|an|my|your|their|the user's)\s+)?(?:(?:own|custom)\s+)?(?:answer|response|something else|something|it|details)(?:\s*\(.*\))?$/.test(label)
		|| /^(?:custom(?: answer| response)?|free[- ]?(?:text|form)|other)\s*[-:—]\s*(?:(?:i'll|i will|you can|the user will)\s+)?(?:type|write|enter|provide|specify)\b.*$/.test(label);
}

export default function askUserQuestion(pi: ExtensionAPI) {
	pi.registerTool({
		name: "ask_user_question",
		label: "Ask user question",
		description:
			"Ask the user a question with selectable options. Set multiSelect to true to start in multi-select mode. The user can always press Space on a choice to enable multi-select; Enter otherwise submits a single choice. Mark the recommended option so it is shown in bold. A typed-answer option is always provided; do not include custom-answer placeholders in options.",
		promptGuidelines: [
			"When you need an answer, clarification, or other inquiry from the user, call this tool instead of asking the question in plain text.",
		],
		parameters: AskUserQuestionParams,
		executionMode: "sequential",

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const details = (answers: string[], wasCustom: boolean, cancelled = false): AnswerDetails => ({
				question: params.question,
				answer: answers.length ? answers.join("; ") : null,
				answers,
				wasCustom,
				...(cancelled ? { cancelled: true } : {}),
			});

			if (ctx.mode !== "tui") {
				return {
					content: [{ type: "text", text: "Error: UI not available (running in non-interactive mode)" }],
					details: details([], false, true),
				};
			}

			const providedOptions = (params.options ?? []).filter((option) => option.trim() && !isCustomAnswerOption(option));
			let multiSelect = params.multiSelect === true;
			const recommended = params.recommended && providedOptions.includes(params.recommended)
				? params.recommended
				: undefined;
			const options = [...providedOptions, "Type your answer"];

			const result = await ctx.ui.custom<{ answers: string[]; wasCustom: boolean } | null>((tui, theme, _kb, done) => {
				let selected = 0;
				let editing = providedOptions.length === 0;
				const checked = new Set<number>();
				let customAnswer = "";
				const editor = new Input({ prompt: "", placeholder: "_" });
				editor.focused = true;

				const refresh = () => tui.requestRender();

				editor.onSubmit = (value) => {
					const answer = value.trim();
					if (!multiSelect || providedOptions.length === 0) {
						if (answer) done({ answers: [answer], wasCustom: true });
						return;
					}
					customAnswer = answer;
					editing = false;
					selected = 0;
					refresh();
				};

				const handleInput = (data: string) => {
					if (editing) {
						if (matchesKey(data, Key.escape)) {
							editing = false;
							editor.setValue("");
							refresh();
							return;
						}
						editor.handleInput(data);
						refresh();
						return;
					}

					if (matchesKey(data, Key.up)) selected = Math.max(0, selected - 1);
					else if (matchesKey(data, Key.down)) selected = Math.min(options.length - 1, selected + 1);
					else if (matchesKey(data, Key.space) && selected < providedOptions.length) {
						multiSelect = true;
						if (checked.has(selected)) checked.delete(selected);
						else checked.add(selected);
					} else if (matchesKey(data, Key.enter)) {
						if (selected === options.length - 1) {
							editing = true;
							editor.setValue(customAnswer);
						} else if (multiSelect) {
							const answers = providedOptions.filter((_, index) => checked.has(index));
							if (customAnswer) answers.push(customAnswer);
							if (answers.length) return done({ answers, wasCustom: customAnswer.length > 0 });
						} else return done({ answers: [options[selected]], wasCustom: false });
					} else if (matchesKey(data, Key.escape)) return done(null);
					else if (selected === options.length - 1 && data.length > 0) {
						editing = true;
						editor.handleInput(data);
					}
					refresh();
				};

				const render = (width: number): string[] => {
					const safeWidth = Math.max(1, width);
					const result: string[] = [theme.fg("accent", "─".repeat(safeWidth))];
					const addWrapped = (text: string, prefix = "") => {
						const prefixWidth = visibleWidth(prefix);
						if (prefixWidth >= safeWidth) {
							result.push(...wrapTextWithAnsi(prefix + text, safeWidth));
							return;
						}
						const lines = wrapTextWithAnsi(text, safeWidth - prefixWidth);
						lines.forEach((line, index) => result.push((index === 0 ? prefix : " ".repeat(prefixWidth)) + line));
					};
					addWrapped(theme.fg("text", params.question));
					result.push("");

					options.forEach((option, index) => {
						const marker = index === selected ? theme.fg("accent", "> ") : "  ";
						const prefix = `${marker}${index + 1}. `;
						if (editing && index === options.length - 1) {
							result.push(...editor.render(Math.max(1, safeWidth - visibleWidth(prefix))).map((line) => prefix + line));
							return;
						}
						const isChecked = index === providedOptions.length ? customAnswer.length > 0 : checked.has(index);
						const checkbox = multiSelect ? `${isChecked ? "[x]" : "[ ]"} ` : "";
						const label = `${option}${option === recommended ? " (recommended)" : ""}`;
						addWrapped(option === recommended ? theme.bold(label) : label, prefix + checkbox);
					});
					if (multiSelect && customAnswer) addWrapped(theme.fg("muted", `Typed answer: ${customAnswer}`));
					const help = editing
						? `${multiSelect && providedOptions.length ? "Enter to save (blank clears)" : "Enter to submit"} • Esc to go back`
						: multiSelect
							? "↑↓ navigate • Space toggle • Enter submit / edit typed answer • Esc cancel"
							: "↑↓ navigate • Enter to select or type • Space multi-select • Esc to cancel";
					result.push("");
					addWrapped(theme.fg("dim", help));
					result.push(theme.fg("accent", "─".repeat(safeWidth)));
					return result.map((line) => truncateToWidth(line, safeWidth, ""));
				};

				return { render, invalidate: () => {}, handleInput };
			});

			if (!result) {
				return { content: [{ type: "text", text: "Question cancelled" }], details: details([], false, true) };
			}
			const answerText = multiSelect ? `User answered:\n${result.answers.map((answer) => `- ${answer}`).join("\n")}` : `User answered: ${result.answers[0]}`;
			return { content: [{ type: "text", text: answerText }], details: details(result.answers, result.wasCustom) };
		},

		renderCall(args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("ask_user_question ")) + theme.fg("muted", args.question), 0, 0);
		},

		renderResult(result, _options, theme) {
			const text = result.content[0];
			return new Text(theme.fg(text?.type === "text" && text.text.startsWith("Error") ? "error" : "text", text?.type === "text" ? text.text : ""), 0, 0);
		},
	});
}
