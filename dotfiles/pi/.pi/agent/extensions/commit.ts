/**
 * commit extension
 *
 * Registers a /commit command that:
 *   1. Saves your current model
 *   2. Auto-switches to a fast/cheap model (haiku by default)
 *   3. Runs the caveman-commit skill to generate a commit message
 *   4. Restores your original model when done
 *
 * Usage:
 *   /commit
 *
 * To change the fast model, edit FAST_MODEL_PROVIDER / FAST_MODEL_ID below.
 */

import type { Model } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const FAST_MODEL_PROVIDER = "google";
const FAST_MODEL_ID = "gemini-3.1-flash-lite-preview";

export default function (pi: ExtensionAPI) {
  let commitInProgress = false;
  let previousModel: Model | undefined;
  let preCommitLeafId: string | null | undefined;

  // Strip full session history for commit turns — only the commit prompt goes to the model
  pi.on("context", async (event, _ctx) => {
    if (!commitInProgress) return;
    const last = [...event.messages].reverse().find(m => m.role === "user");
    return { messages: last ? [last] : [] };
  });

  // When the agent finishes: prune commit turn from session, restore model
  pi.on("agent_end", async (_event, ctx) => {
    if (!commitInProgress) return;
    commitInProgress = false;

    // Orphan all commit-turn entries — branch back to pre-commit leaf
    if (preCommitLeafId !== undefined) {
      if (preCommitLeafId === null) {
        ctx.sessionManager.resetLeaf();
      } else {
        ctx.sessionManager.branch(preCommitLeafId);
      }
      preCommitLeafId = undefined;
    }

    if (previousModel) {
      const restored = previousModel;
      previousModel = undefined;
      const success = await pi.setModel(restored);
      if (success) {
        ctx.ui.notify(`↩ Restored model: ${restored.id}`, "info");
      }
    }
  });

  pi.registerCommand("commit", {
    description: `Generate commit message using ${FAST_MODEL_ID}, then restore model`,
    handler: async (_args, ctx) => {
      // Wait for any ongoing agent turn to finish first
      await ctx.waitForIdle();

      const fastModel = ctx.modelRegistry.find(
        FAST_MODEL_PROVIDER,
        FAST_MODEL_ID,
      );
      if (!fastModel) {
        ctx.ui.notify(
          `Model not found: ${FAST_MODEL_PROVIDER}/${FAST_MODEL_ID}. Check FAST_MODEL_ID in the extension.`,
          "error",
        );
        return;
      }

      // Snapshot leaf before anything is written — used to prune commit turn later
      preCommitLeafId = ctx.sessionManager.getLeafId();

      // Save current model so we can restore it after the commit
      previousModel = ctx.model;

      const switched = await pi.setModel(fastModel);
      if (!switched) {
        ctx.ui.notify(`No API key available for ${FAST_MODEL_ID}`, "error");
        previousModel = undefined;
        return;
      }

      ctx.ui.notify(`⚡ Switched to ${FAST_MODEL_ID} for commit`, "info");
      commitInProgress = true;

      // Trigger the caveman-commit skill (expands via normal skill pipeline)
      pi.sendUserMessage(`

Role: Tech Lead.

Task:

1. Run \`git diff --cached\` to get the staged changes.
2. If result is empty, ask the user to stage changes and stop there.
3. If not, only then analyze the staged diff via \`git diff --cached\`
4. Generate a conventional commit message following the specification:
   - Format: \`type(scope): subject\`
   - Types allowed: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
   - Subject: Imperative mood, lowercase, no period, max 50 characters
   - Body (if needed): Wrap at 72 characters, explain _why_ not _how_. Keep it short. Preferably one liner
   - Footer: Flag breaking changes with \`BREAKING CHANGE:\`
5. If you see multiple completely different scopes, use your best judgement to decide which one to commit.
6. Commit the changes with the generated message and body
        `);
    },
  });
}
