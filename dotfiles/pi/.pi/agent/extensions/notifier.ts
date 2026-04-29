/**
 * Pi Notifier Extension
 *
 * Sends a native system notification when the LLM run is done.
 *
 * macOS  → osascript (Notification Center, works even when terminal is unfocused)
 * Linux  → notify-send (libnotify)
 * WSL    → PowerShell toast notification
 * Other  → OSC 777 terminal escape (Ghostty, iTerm2, WezTerm, rxvt-unicode)
 *          OSC 99  terminal escape (Kitty)
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { execFile } from "node:child_process";
import { basename } from "node:path";

const LOGO = "π";

function notifyMacOS(title: string, subtitle: string, body: string): void {
  const script = `display notification "${body}" with title "${title}" subtitle "${subtitle}"`;
  execFile("osascript", ["-e", script], { timeout: 5000 }, () => {});
}

function notifyLinux(title: string, body: string): void {
  execFile("notify-send", [title, body], { timeout: 5000 }, () => {});
}

function notifyWindows(title: string, body: string): void {
  const type = "Windows.UI.Notifications";
  const mgr = `[${type}.ToastNotificationManager, ${type}, ContentType = WindowsRuntime]`;
  const template = `[${type}.ToastTemplateType]::ToastText01`;
  const toast = `[${type}.ToastNotification]::new($xml)`;
  const script = [
    `${mgr} > $null`,
    `$xml = [${type}.ToastNotificationManager]::GetTemplateContent(${template})`,
    `$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${body}')) > $null`,
    `[${type}.ToastNotificationManager]::CreateToastNotifier('${title}').Show(${toast})`,
  ].join("; ");
  execFile("powershell.exe", ["-NoProfile", "-Command", script], { timeout: 5000 }, () => {});
}

function notifyOSC777(title: string, body: string): void {
  process.stdout.write(`\x1b]777;notify;${title};${body}\x07`);
}

function notifyOSC99(title: string, body: string): void {
  process.stdout.write(`\x1b]99;i=1:d=0;${title}\x1b\\`);
  process.stdout.write(`\x1b]99;i=1:p=body;${body}\x1b\\`);
}

function notify(title: string, subtitle: string, body: string): void {
  if (process.platform === "darwin") {
    notifyMacOS(title, subtitle, body);
  } else if (process.env.WT_SESSION) {
    // Windows Terminal (WSL)
    notifyWindows(`${title} — ${subtitle}`, body);
  } else if (process.env.KITTY_WINDOW_ID) {
    notifyOSC99(`${title} — ${subtitle}`, body);
  } else if (process.platform === "linux") {
    notifyLinux(`${title} — ${subtitle}`, body);
  } else {
    notifyOSC777(`${title} — ${subtitle}`, body);
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("agent_end", async (_event, ctx: ExtensionContext) => {
    const project = basename(ctx.cwd);
    notify(`${LOGO} Pi`, project, "Run complete — ready for input");
  });
}
