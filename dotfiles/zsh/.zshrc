fastfetch
export ZSH="$HOME/.oh-my-zsh"
export TERM="xterm-256color"

# ── zsh-autosuggestions (must be before omz source) ──────────────────────
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=244"
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20

DISABLE_UNTRACKED_FILES_DIRTY="true"
plugins=(git z zsh-autosuggestions zsh-syntax-highlighting)
source "$ZSH/oh-my-zsh.sh"

# ── zsh-syntax-highlighting colors ───────────────────────────────────────
typeset -A ZSH_HIGHLIGHT_STYLES
ZSH_HIGHLIGHT_STYLES[command]='fg=blue,bold'
ZSH_HIGHLIGHT_STYLES[builtin]='fg=cyan,bold'
ZSH_HIGHLIGHT_STYLES[alias]='fg=green,bold'
ZSH_HIGHLIGHT_STYLES[unknown-token]='fg=red'
ZSH_HIGHLIGHT_STYLES[path]='fg=white,underline'

# ── aliases ──────────────────────────────────────────────────────────────
alias v="NVIM_APPNAME=nvim.12 nvim"
alias vm="nvim"
alias lg="lazygit"
alias zc="nvim ~/.zshrc"
alias zs="source ~/.zshrc"
alias ls="eza"
alias ll="eza -la --git"
alias lt="eza --tree --level=2"
alias cat="bat --style=plain"

# OCI remote dev
alias oci="mosh --ssh='ssh -i ~/Development/Personal/OCI/ssh-key-2025-08-11.key' ubuntu@140.245.9.229"
alias oci-ssh="ssh oci"

# VS Code CLI
export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"

# Node / JS
alias nr="npm run"
alias nd="npm run dev"
alias pi="pnpm install"
alias pd="pnpm dev"
alias pb="pnpm build"
alias px="pnpm exec"

# ── tools ────────────────────────────────────────────────────────────────
eval "$(starship init zsh)"
source <(fzf --zsh)
eval "$(fnm env --use-on-cd --shell zsh)"

# ── pnpm ─────────────────────────────────────────────────────────────────
export PNPM_HOME="$HOME/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# ── bun ──────────────────────────────────────────────────────────────────
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
[[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"

# ── optional tools (guarded) ─────────────────────────────────────────────
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
export PATH="$HOME/.local/bin:$PATH"

# ── history ──────────────────────────────────────────────────────────────
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory sharehistory incappendhistory extendedhistory
setopt histignorealldups histignorespace histignoredups histreduceblanks
