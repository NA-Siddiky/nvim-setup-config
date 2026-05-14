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

const FAST_MODEL_PROVIDER = "anthropic";
const FAST_MODEL_ID = "claude-haiku-4-5";

export default function (pi: ExtensionAPI) {
	let commitInProgress = false;
	let previousModel: Model | undefined;

	// When the agent finishes, restore the previous model (if we switched for a commit)
	pi.on("agent_end", async (_event, ctx) => {
		if (!commitInProgress) return;
		commitInProgress = false;

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

			const fastModel = ctx.modelRegistry.find(FAST_MODEL_PROVIDER, FAST_MODEL_ID);
			if (!fastModel) {
				ctx.ui.notify(
					`Model not found: ${FAST_MODEL_PROVIDER}/${FAST_MODEL_ID}. Check FAST_MODEL_ID in the extension.`,
					"error",
				);
				return;
			}

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
			pi.sendUserMessage("/skill:caveman-commit");
		},
	});
}
