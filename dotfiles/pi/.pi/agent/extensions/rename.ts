/**
 * Auto-rename sessions using gemini-flash-lite.
 * Fires on the first user message, generates a short descriptive title, sets it as the session name.
 */

import { complete, getModel } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  let named = false;

  // On session restore/resume, skip renaming if already named or has history
  pi.on("session_start", async (_event, ctx) => {
    named = !!pi.getSessionName() || ctx.sessionManager.getBranch().length > 0;
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (named) return;
    named = true; // guard against double-fire

    const model = getModel("google", "gemini-3.1-flash-lite-preview");
    if (!model) return;

    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok || !auth.apiKey) return;

    try {
      const response = await complete(
        model,
        {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: [
                    "Give a short 4-6 word title for a coding/technical session starting with this message.",
                    "Rules: no punctuation, no quotes, lowercase, plain words only, captures the core task.",
                    "Reply with ONLY the title — nothing else.",
                    "",
                    `Message: ${event.prompt}`,
                  ].join("\n"),
                },
              ],
              timestamp: Date.now(),
            },
          ],
        },
        { apiKey: auth.apiKey, headers: auth.headers },
      );

      const name = response.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text.trim())
        .join("")
        .replace(/['"]/g, "")
        .trim();

      if (name) {
        pi.setSessionName(name);
      }
    } catch {
      // silently skip — naming is best-effort
    }
  });
}
