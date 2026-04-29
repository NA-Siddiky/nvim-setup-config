import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { StatusWidget } from "./widget.js";

export default function (pi: ExtensionAPI) {
  let widget: StatusWidget | undefined;
  let savedCtx: ExtensionContext | undefined;

  const thinkingPoller = {
    timer: undefined as ReturnType<typeof setInterval> | undefined,
    last: "",
    start() {
      if (this.timer !== undefined) return;
      this.last = pi.getThinkingLevel();
      this.timer = setInterval(() => {
        const current = pi.getThinkingLevel();
        if (current === this.last) return;
        this.last = current;
        widget?.update();
      }, 150);
    },
    stop() {
      if (this.timer === undefined) return;
      clearInterval(this.timer);
      this.timer = undefined;
    },
  };

  pi.on("session_start", (_, ctx: ExtensionContext) => {
    ctx.ui.setFooter(() => ({ render: () => [], invalidate() {} }));
    savedCtx = ctx;
    widget = ctx.model ? new StatusWidget(pi, ctx, ctx.model) : undefined;
    widget?.update();
    thinkingPoller.start();
  });

  pi.on("session_shutdown", () => {
    thinkingPoller.stop();
  });

  pi.on("model_select", (event) => {
    if (widget) {
      widget.model = event.model;
    } else if (savedCtx) {
      widget = new StatusWidget(pi, savedCtx, event.model);
    }
    widget?.update();
  });

  pi.on("tool_execution_start", (event) => {
    widget?.startTool(event.toolName);
  });

  pi.on("turn_end", () => {
    widget?.update();
  });
}
