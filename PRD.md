## Problem Statement

Managing multiple coding agents across different repositories in the terminal is chaotic. There's no unified way to organize terminal sessions by repo, quickly spin up new agent panes, or switch context between projects without losing track of what's running where. You end up with a mess of tmux windows and panes with no structure.

## Solution

**emux** — a TUI-powered tmux workspace manager for coding agents. It provides a sidebar (built with OpenTUI React) that organizes terminal sessions by repository. Users can add repos, create named sessions under them, and split sessions into side-by-side panes. Selecting a session in the sidebar swaps the main area to show only that session's panes.

Layout:

```
┌──────────┬─────────────┬────────────┐
│ SIDEBAR  │  PANE 1     │  PANE 2    │
│          │             │            │
│ ▼ repo-a │  $ claude   │  $ aider   │
│   ● s1   │             │            │
│     s2   │             │            │
│          │             │            │
│ ▶ repo-b │             │            │
│          │             │            │
└──────────┴─────────────┴────────────┘
```

## User Stories

1. As a developer, I want to launch emux from the command line, so that a tmux session with a sidebar and main area is created for me.
2. As a developer, I want to add a repository to the sidebar using a directory picker, so that I can organize my work by project.
3. As a developer, I want repos to appear as collapsible folders in the sidebar, so that I can expand/collapse them to manage screen space.
4. As a developer, I want to create a new session under a repo, so that a terminal pane opens in the main area cd'd into that repo's directory.
5. As a developer, I want to split a session into multiple side-by-side horizontal panes, so that I can run multiple agents for the same task.
6. As a developer, I want to select a session in the sidebar and have the main area switch to show only that session's panes, so that I can context-switch between tasks cleanly.
7. As a developer, I want to navigate the sidebar with j/k or arrow keys and select with Enter, so that I can move quickly without a mouse.
8. As a developer, I want to close a pane and have it disappear from the sidebar, so that the sidebar always reflects what's actually running.
9. As a developer, I want to remove a repo from the sidebar, so that I can clean up projects I'm no longer working on.
10. As a developer, I want new panes to inherit the working directory of their parent session's repo, so that agents start in the right place.
11. As a developer, I want the sidebar to show which session is currently active, so that I know what I'm looking at in the main area.
12. As a developer, I want to press a key (e.g. `a`) to open a directory picker (fzf-style) for adding repos, so that adding repos is fast.
13. As a developer, I want to press a key (e.g. `n`) while a repo is highlighted to create a new session under it, so that creating sessions is fast.
14. As a developer, I want to press a key (e.g. `s`) while a session is highlighted to add a new horizontal pane to it, so that splitting is fast.
15. As a developer, I want panes from non-selected sessions to be hidden (not destroyed), so that switching sessions is instant and agents keep running in the background.
16. As a developer, I want to use default tmux keybinds for interacting with panes in the main area, so that I don't have to learn new shortcuts.
17. As a developer, I want the sidebar to be a fixed narrow width on the left, so that it doesn't take up too much space.
18. As a developer, I want to be able to delete a session and have all its panes close, so that I can clean up finished work.

## Implementation Decisions

### Modules

**1. CLI Entry Point (`emux` command)**
- Bootstraps a tmux session with two regions: a narrow left pane for the sidebar TUI and the main area on the right.
- Starts the OpenTUI React sidebar app in the left pane.
- If emux is already running, attaches to the existing session instead of creating a new one.

**2. TUI Sidebar (OpenTUI React)**
- Runs as a Bun process inside the left tmux pane.
- Renders a tree view: repos as collapsible folders, sessions as selectable items underneath.
- Highlights the active session.
- Keyboard handlers:
  - `j`/`k` or arrows: navigate up/down the tree.
  - `Enter`: select a session (switches main area to its panes).
  - `a`: open directory picker to add a repo.
  - `n`: create a new session under the highlighted repo.
  - `s`: split the selected session (add a new horizontal pane).
  - `d`: delete the highlighted session or remove the highlighted repo.
  - `Tab` / arrow: collapse/expand repo folders.
- The directory picker for adding repos should use fzf or a similar fuzzy-finder approach. This can be spawned as a subprocess or built as an inline TUI component.

**3. tmux Manager**
- Exposes functions to:
  - Create a new tmux pane (horizontal split) inside the main area, cd'd to a given directory.
  - Show/hide a group of panes (swap visibility when the user selects a different session).
  - Close/destroy a pane or group of panes.
  - Query the current state of panes (which are alive, their dimensions).
- Communicates with tmux via `Bun.$` shell commands (`tmux split-window`, `tmux select-pane`, `tmux swap-pane`, etc.).
- Pane visibility swapping: when switching sessions, the current session's panes are moved off-screen or to a hidden window, and the target session's panes are moved into the main area. This can be achieved using tmux window swapping or by using a dedicated tmux window per session and switching the visible window.

### Architecture Decisions

- **One tmux window per session**: Each session gets its own tmux window. The sidebar always occupies a pane in every window (or is in a separate persistent pane using tmux's `link-window` or a fixed layout). When the user selects a session, emux switches to that session's tmux window. This is the simplest approach for show/hide behavior.
- **Sidebar communicates with tmux via shell commands**: The TUI sidebar process runs tmux commands (via `Bun.$`) to create panes, switch windows, etc. No IPC server needed for v1.
- **In-memory state only**: No persistence for now. The sidebar maintains a simple in-memory data structure: `Map<repoPath, Session[]>` where each Session tracks its tmux window ID and pane IDs.
- **fzf for directory picking**: Shell out to `fzf` for the directory picker rather than building a custom one. If fzf is not installed, fall back to a simple text input in the TUI.
- **Bun runtime**: The entire project runs on Bun. The CLI entry point, the TUI sidebar, and the tmux manager all use Bun APIs.

## Testing Decisions

Good tests verify external behavior through the module's public interface, not implementation details. Tests should not depend on tmux being installed or running.

**Modules to test:**

- **tmux Manager**: Test that the correct tmux commands are generated for each operation (create pane, switch window, close pane). Mock `Bun.$` to capture commands rather than executing them. Verify command strings match expected tmux invocations.
- **State management**: Test the in-memory data model — adding repos, creating sessions, adding panes to sessions, removing sessions, switching active session. Pure data logic, no UI or tmux dependency.

**Modules NOT tested (for now):**

- **TUI Sidebar**: Visual/interactive component — manual testing is more practical for v1. Can add OpenTUI snapshot tests later.
- **CLI Entry Point**: Thin orchestration layer — test manually.

**Test runner:** `bun test`

## Out of Scope

- State persistence across restarts (save/restore sessions, repos, layouts)
- Agent lifecycle management (start/stop/restart agents, health checks)
- Agent status indicators in the sidebar (running/idle/error)
- Custom tmux keybindings or overrides
- Mouse support in the sidebar
- Multi-monitor or multi-tmux-server support
- Remote/SSH session support
- Configuration file for preferences
- Session naming/renaming
- Pane resizing from the sidebar

## Further Notes

- The project name is **emux**.
- Depends on tmux being installed on the system.
- Depends on fzf being installed for the directory picker (with a text input fallback).
- Built with Bun, OpenTUI React, and tmux shell commands.
- The sidebar should be ~25-30 columns wide by default.
