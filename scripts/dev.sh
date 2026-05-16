#!/bin/bash
# if [ "$WEZTERM" != "true" ]; then
#   export WEZTERM=true
#   exec wezterm -e "$0" "$@" &
#   exit 0
# fi
# Set your work directory here
WORK_DIR=$(pwd)
NAME=$(basename "$WORK_DIR")
# Reattach if a session for this directory already exists
if tmux has-session -t "$NAME" 2>/dev/null; then
  tmux attach-session -t "$NAME"
else
  cd "$WORK_DIR" || exit 1

  # Detect package manager from lockfile; default to pnpm
  if [ -f bun.lock ]; then
    DEV_CMD="bun dev"
  elif [ -f pnpm-lock.yaml ]; then
    DEV_CMD="pnpm dev"
  elif [ -f package-lock.json ]; then
    DEV_CMD="npm run dev"
  else
    DEV_CMD="pnpm dev"
  fi

  tmux new-session -d -s "$NAME" -n editor

  # Window 1: nvim with current directory
  tmux send-keys -t "$NAME":editor 'v .' C-m
  sleep 0.1

  # Window 2: Left - terminal, Right - dev server (top) + focused pane (bottom)
  tmux new-window -t "$NAME" -n dev

  # Split window into two columns (left 80%, right 20%)
  tmux split-window -h -l 20% -t "$NAME":dev
  tmux send-keys -t "$NAME":dev.2 "$DEV_CMD" C-m
  sleep 0.1

  # Split the right pane into two (top 50%, bottom 50%)
  tmux split-window -v -t "$NAME":dev.2

  # Select the bottom-right pane as focused
  tmux select-pane -t "$NAME":dev.3

  # Window 3: lazygit
  tmux new-window -t "$NAME" -n git
  tmux send-keys -t "$NAME":git 'lazygit' C-m
  sleep 0.1

  # Select the first window as starting point
  tmux select-window -t "$NAME":editor

  # Attach to the session
  tmux attach-session -t "$NAME"
fi
