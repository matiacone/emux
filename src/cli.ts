#!/usr/bin/env bun

/**
 * emux CLI entry point.
 * Creates a tmux session with a sidebar pane (OpenTUI React) and a main shell pane.
 * If the session already exists, attaches to it.
 */

const SESSION_NAME = "emux";
const SIDEBAR_WIDTH = 28;

async function tmuxSessionExists(name: string): Promise<boolean> {
  const result = Bun.spawnSync(["tmux", "has-session", "-t", name]);
  return result.exitCode === 0;
}

async function main() {
  // Check if tmux is installed
  const tmuxCheck = Bun.spawnSync(["which", "tmux"]);
  if (tmuxCheck.exitCode !== 0) {
    console.error("tmux is not installed. Please install tmux first.");
    process.exit(1);
  }

  const isInsideTmux = !!process.env.TMUX;

  if (await tmuxSessionExists(SESSION_NAME)) {
    // Session exists — attach to it
    if (isInsideTmux) {
      Bun.spawnSync(["tmux", "switch-client", "-t", SESSION_NAME], {
        stdio: ["inherit", "inherit", "inherit"],
      });
    } else {
      Bun.spawnSync(["tmux", "attach-session", "-t", SESSION_NAME], {
        stdio: ["inherit", "inherit", "inherit"],
      });
    }
    return;
  }

  // Get the absolute path to the sidebar script
  const sidebarPath = new URL("./sidebar.tsx", import.meta.url).pathname;

  // Create new tmux session (starts detached)
  // The first pane will be the main shell area
  Bun.spawnSync([
    "tmux",
    "new-session",
    "-d",
    "-s",
    SESSION_NAME,
    "-x",
    "200",
    "-y",
    "50",
  ]);

  // Split the window to create the sidebar pane on the left
  // -h = horizontal split (side by side), -b = insert before (left), -l = size
  Bun.spawnSync([
    "tmux",
    "split-window",
    "-h",
    "-b",
    "-l",
    String(SIDEBAR_WIDTH),
    "-t",
    `${SESSION_NAME}:0`,
    "bun",
    "run",
    sidebarPath,
  ]);

  // Select the main pane (right side, pane 1) as the active pane
  Bun.spawnSync(["tmux", "select-pane", "-t", `${SESSION_NAME}:0.1`]);

  // Attach to the session
  if (isInsideTmux) {
    Bun.spawnSync(["tmux", "switch-client", "-t", SESSION_NAME], {
      stdio: ["inherit", "inherit", "inherit"],
    });
  } else {
    Bun.spawnSync(["tmux", "attach-session", "-t", SESSION_NAME], {
      stdio: ["inherit", "inherit", "inherit"],
    });
  }
}

main();
