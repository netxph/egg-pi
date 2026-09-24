import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Input, Key, matchesKey, Text, truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const AskUserQuestionParams = Type.Object({
	question: Type.String({ description: "The question to ask the user" }),
	options: Type.Optional(Type.Array(Type.String(), { description: "Options the user can choose from" })),
	recommended: Type.Optional(Type.String({ description: "The recommended option; it must match one option exactly" })),
});

interface AnswerDetails {
	question: string;
	answer: string | null;
	wasCustom: boolean;
	cancelled?: boolean;
}

export default function askUserQuestion(pi: ExtensionAPI) {
	pi.registerTool({
		name: "ask_user_question",
		label: "Ask user question",
		description:
			"Ask the user a question with selectable options. Mark the recommended option so it is shown in bold. The user can always enter a custom answer.",
		promptGuidelines: [
			"When you need an answer, clarification, or other inquiry from the user, call this tool instead of asking the question in plain text.",
		],
		parameters: AskUserQuestionParams,
		executionMode: "sequential",

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const details = (answer: string | null, wasCustom: boolean, cancelled = false): AnswerDetails => ({
				question: params.question,
				answer,
				wasCustom,
				...(cancelled ? { cancelled: true } : {}),
			});

			if (ctx.mode !== "tui") {
				return {
					content: [{ type: "text", text: "Error: UI not available (running in non-interactive mode)" }],
					details: details(null, false, true),
				};
			}

			const providedOptions = params.options ?? [];
			const recommended = params.recommended && providedOptions.includes(params.recommended)
				? params.recommended
				: undefined;
			const options = [...providedOptions, "Type your answer"];

			const result = await ctx.ui.custom<{ answer: string; wasCustom: boolean } | null>((tui, theme, _kb, done) => {
				let selected = 0;
				let editing = providedOptions.length === 0;
				const editor = new Input({ prompt: "", placeholder: "_" });
				editor.focused = true;

				const refresh = () => tui.requestRender();

				editor.onSubmit = (value) => {
					const answer = value.trim();
					if (answer) done({ answer, wasCustom: true });
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
					else if (matchesKey(data, Key.enter)) {
						if (selected === options.length - 1) editing = true;
						else return done({ answer: options[selected], wasCustom: false });
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
					result.push(...wrapTextWithAnsi(theme.fg("text", params.question), safeWidth));
					result.push("");

					options.forEach((option, index) => {
						const prefix = index === selected ? theme.fg("accent", "> ") : "  ";
						if (editing && index === options.length - 1) {
							result.push(...editor.render(Math.max(1, safeWidth - 5)).map((line) => `${prefix}${index + 1}. ${line}`));
							return;
						}
						const label = `${index + 1}. ${option}${option === recommended ? " (recommended)" : ""}`;
						result.push(prefix + (option === recommended ? theme.bold(label) : label));
					});
					result.push("", theme.fg("dim", editing ? "Enter to submit • Esc to go back" : "↑↓ navigate • Enter to select or type • Esc to cancel"));
					result.push(theme.fg("accent", "─".repeat(safeWidth)));
					return result.map((line) => truncateToWidth(line, safeWidth, ""));
				};

				return { render, invalidate: () => {}, handleInput };
			});

			if (!result) {
				return { content: [{ type: "text", text: "Question cancelled" }], details: details(null, false, true) };
			}
			return { content: [{ type: "text", text: `User answered: ${result.answer}` }], details: details(result.answer, result.wasCustom) };
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
