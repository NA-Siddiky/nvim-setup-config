/**
 * /commit — Trigger the "commit" subagent using gemini-3.1-flash-lite-preview.
 * The agent is defined in ~/.pi/agent/agents/commit.md.
 * pi-subagents handles the progress display and model isolation.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("commit", {
    description: "Run conventional commit workflow via gemini-flash-lite subagent",
    handler: async (_args, _ctx) => {
      pi.sendUserMessage(
        '/run commit "Run the commit workflow as instructed."',
        { deliverAs: "followUp" },
      );
    },
  });
}
