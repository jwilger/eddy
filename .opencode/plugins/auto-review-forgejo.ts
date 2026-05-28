import { tool, type Plugin } from "@opencode-ai/plugin";
import { blocksForgejoInlineReply, commandText, recordForgejoFeedback } from "./lib/shared.ts";

export const AutoReviewForgejoPlugin: Plugin = async () => ({
  tool: {
    forgejo_feedback_status: tool({
      description: "Record or summarize unresolved Forgejo feedback status for compaction context.",
      args: { summary: tool.schema.string().describe("Feedback status summary") },
      async execute(args, context) {
        recordForgejoFeedback(context.sessionID, args.summary);
        return `Forgejo feedback status recorded: ${args.summary}`;
      },
    }),
  },
  "tool.execute.before": async (input, output) => {
    if (/bash$/i.test(input.tool) && blocksForgejoInlineReply(commandText(output.args))) {
      throw new Error("Forgejo review gate: inline feedback replies must use the existing review comment thread before any top-level PR comment.");
    }
  },
});

export default AutoReviewForgejoPlugin;
