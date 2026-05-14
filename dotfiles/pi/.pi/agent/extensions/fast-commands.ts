/**
 * fast-commands.ts
 *
 * Registers /pr, /standup, /explain as fast-model commands.
 * Each command switches to a cheap model, runs the task, then restores.
 *
 * Commands:
 *   /pr          — create a pull request via gh
 *   /standup     — generate standup from recent git activity
 *   /explain     — explain a file or symbol
 */

import type { Model } from "@earendil-works/pi-ai";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";

const FAST_MODEL_PROVIDER = "google";
const FAST_MODEL_ID = "gemini-3.1-flash-lite-preview";

// ── shared helper ─────────────────────────────────────────────────────────────

function registerFastCommand(
  pi: ExtensionAPI,
  name: string,
  description: string,
  buildPrompt: (args: string) => string,
) {
  let inProgress = false;
  let previousModel: Model | undefined;

  pi.on("agent_end", async (_event, ctx) => {
    if (!inProgress) return;
    inProgress = false;

    if (previousModel) {
      const restored = previousModel;
      previousModel = undefined;
      const success = await pi.setModel(restored);
      if (success) {
        ctx.ui.notify(`↩ Restored model: ${restored.id}`, "info");
      }
    }
  });

  pi.registerCommand(name, {
    description: `${description} (via ${FAST_MODEL_ID})`,
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      await ctx.waitForIdle();

      const fastModel = ctx.modelRegistry.find(
        FAST_MODEL_PROVIDER,
        FAST_MODEL_ID,
      );
      if (!fastModel) {
        ctx.ui.notify(
          `Model not found: ${FAST_MODEL_PROVIDER}/${FAST_MODEL_ID}`,
          "error",
        );
        return;
      }

      previousModel = ctx.model;

      const switched = await pi.setModel(fastModel);
      if (!switched) {
        ctx.ui.notify(`No API key for ${FAST_MODEL_ID}`, "error");
        previousModel = undefined;
        return;
      }

      ctx.ui.notify(`⚡ Switched to ${FAST_MODEL_ID} for /${name}`, "info");
      inProgress = true;

      pi.sendUserMessage(buildPrompt(args));
    },
  });
}

// ── extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {

  // /pr
  registerFastCommand(pi, "pr", "Create a pull request", (_args) => `
Role: Senior Engineer.

Task:

1. Run \`git remote get-url origin\` to identify the repo.
2. Run \`git diff main...HEAD\` to get all changes on this branch.
3. Run \`git log main...HEAD --oneline\` to get the commit history.
4. Generate a pull request with:
   - **Title**: Concise, imperative, max 72 chars
   - **Body**:
     - ## What
       One paragraph summary of what changed
     - ## Why
       Why this change was needed
     - ## How
       Key implementation decisions worth noting (skip if obvious)
     - ## Testing
       How to verify the changes work
5. Run \`gh pr create --title "..." --body "..."\` to create the PR.
`);

  // /standup
  registerFastCommand(pi, "standup", "Generate daily standup from git activity", (_args) => `
Role: Engineer writing a daily standup.

Task:

1. Run \`git log --since="24 hours ago" --oneline --author="$(git config user.name)"\`.
2. Run \`git diff HEAD~5...HEAD --stat\` for recent file changes.
3. Summarize into standup format:
   - **Yesterday**: what was done (from commits)
   - **Today**: what's next (infer from WIP or last commit direction)
   - **Blockers**: none unless context suggests otherwise
4. Keep it short — 3-5 bullet points max. No fluff.
`);

  // /explain
  registerFastCommand(pi, "explain", "Explain a file or symbol", (args) => `
Role: Senior Engineer explaining to a smart peer.

Task:

1. ${args ? `Read or find: ${args}` : "Explain the last code discussed in context."}
2. Explain:
   - **What it does** — one sentence summary
   - **How it works** — key logic, data flow, important decisions
   - **Why it exists** — the problem it solves
   - **Gotchas** — non-obvious behavior, edge cases, performance traps
3. Keep it tight. No padding. Use code snippets only when they clarify.
`);

}
