#!/bin/bash

# ── Config ────────────────────────────────────────────────────────────────
PERSONAL_GH_USER="Nur-E-Alom Siddiky"
PERSONAL_EMAIL="siddiky.academic@gmail.com"
WORK_GH_USER="na-siddiky-qp"
WORK_EMAIL="nur-e-alom.siddiky@questionpro.com"
# Git identities auto-switch by directory:
#   ~/Development/Personal/ → personal account (includes OCI/)
#   ~/Development/Office/   → work account

OCI_IP="140.245.9.229"
OCI_KEY="$HOME/Development/Personal/OCI/ssh-key-2025-08-11.key"
# ──────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DOTFILES_DIR="$REPO_DIR/dotfiles"

RED='\033[31m'; GREEN='\033[32m'; BLUE='\033[34m'; YELLOW='\033[33m'; NC='\033[0m'

log_action() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$HOME/setup.log" 2>/dev/null
}

notify() {
  osascript -e "display notification \"$1\" with title \"Mac Setup\"" 2>/dev/null || true
  log_action "$1"
  echo -e "${GREEN}✓ $1${NC}"
}

set_homebrew() {
  echo -e "${BLUE}Setting up Homebrew...${NC}"
  if ! command -v brew >/dev/null 2>&1; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || {
      echo -e "${RED}Error: Homebrew installation failed.${NC}"
      log_action "Homebrew installation failed"
      return 1
    }
    echo >> "$HOME/.zprofile"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
    eval "$(/opt/homebrew/bin/brew shellenv)"
    notify "Homebrew installed"
  else
    echo -e "${GREEN}Homebrew already installed.${NC}"
  fi
}

set_apps() {
  echo -e "${BLUE}Installing apps...${NC}"
  if ! command -v brew >/dev/null 2>&1; then
    echo -e "${RED}Error: run set_homebrew first.${NC}"
    return 1
  fi

  # CLI tools
  local cli_tools=(
    zsh stow neovim git fastfetch tree-sitter ripgrep lazygit starship
    fzf tmux fnm eza gh jq bat fd git-delta pnpm mosh
  )

  # GUI apps (casks)
  local casks=(
    ghostty raycast alt-tab shottr mos visual-studio-code
  )

  for tool in "${cli_tools[@]}"; do
    echo -e "${BLUE}  brew install $tool${NC}"
    brew install "$tool" 2>/dev/null || { echo -e "${YELLOW}  Warning: $tool failed${NC}"; log_action "Failed: $tool"; }
  done

  for cask in "${casks[@]}"; do
    echo -e "${BLUE}  brew install --cask $cask${NC}"
    brew install --cask "$cask" 2>/dev/null || { echo -e "${YELLOW}  Warning: $cask failed${NC}"; log_action "Failed cask: $cask"; }
  done

  brew cleanup
  notify "App installation complete"
}

set_node() {
  echo -e "${BLUE}Setting up Node LTS via fnm...${NC}"
  if ! command -v fnm >/dev/null 2>&1; then
    echo -e "${RED}fnm not found, run set_apps first${NC}"
    return 1
  fi
  eval "$(fnm env)"
  fnm install --lts && fnm use lts-latest && fnm default lts-latest || {
    echo -e "${YELLOW}Warning: failed to install Node LTS${NC}"
    return 1
  }
  echo -e "${GREEN}Node $(node --version) ready${NC}"

  # Install bun separately (fastest JS runtime/bundler)
  if ! command -v bun >/dev/null 2>&1; then
    curl -fsSL https://bun.sh/install | bash || echo -e "${YELLOW}Warning: bun install failed${NC}"
  fi

  notify "Node + bun installed"
}

set_gitconfig() {
  echo -e "${BLUE}Writing git config files...${NC}"

  cat > "$HOME/.gitconfig" << EOF
[user]
  name = Nur-e-alom Siddiky
[credential]
  helper = osxkeychain
[core]
  ignorecase = false
  excludesfile = ~/.gitignore_global
[includeIf "gitdir/i:~/Development/Office/"]
  path = ~/.gitconfig-qp
[includeIf "gitdir/i:~/Development/Personal/"]
  path = ~/.gitconfig-personal
[pager]
  diff = delta
  log = delta
  reflog = delta
  show = delta
[interactive]
  diffFilter = delta --color-only
[delta]
  navigate = true
  light = false
  side-by-side = true
[pull]
  rebase = false
[init]
  defaultBranch = main
EOF

  cat > "$HOME/.gitignore_global" << 'EOF'
# macOS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes

# editors
.idea/
*.swp
*.swo
.vscode/

# env / secrets
.env
.env.local
.env.*.local
EOF
  git config --global core.excludesfile "$HOME/.gitignore_global"

  cat > "$HOME/.gitconfig-qp" << EOF
[user]
  name = ${WORK_GH_USER}
  email = ${WORK_EMAIL}
EOF

  cat > "$HOME/.gitconfig-personal" << EOF
[user]
  name = ${PERSONAL_GH_USER}
  email = ${PERSONAL_EMAIL}
EOF

  notify "Git config written"
}

set_dotfiles() {
  echo -e "${BLUE}Setting up Zsh + oh-my-zsh...${NC}"

  if [[ ! -d ~/.oh-my-zsh ]]; then
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended || {
      echo -e "${RED}Error: oh-my-zsh install failed.${NC}"
      log_action "oh-my-zsh installation failed"
      return 1
    }
  else
    echo -e "${GREEN}oh-my-zsh already installed.${NC}"
  fi

  local brew_zsh="/opt/homebrew/bin/zsh"
  if ! grep -qF "$brew_zsh" /etc/shells; then
    echo "$brew_zsh" | sudo tee -a /etc/shells
  fi
  local current_shell
  current_shell=$(dscl . -read "/Users/$USER" UserShell | awk '{print $2}')
  if [[ "$current_shell" != "$brew_zsh" ]]; then
    chsh -s "$brew_zsh" "$USER" || {
      echo -e "${RED}Error: could not set zsh as default shell.${NC}"
      return 1
    }
  fi

  local zsh_custom=${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}
  local plugins=(
    "zsh-users/zsh-autosuggestions"
    "zsh-users/zsh-syntax-highlighting"
  )
  for plugin in "${plugins[@]}"; do
    local dest="$zsh_custom/plugins/${plugin##*/}"
    if [[ ! -d "$dest" ]]; then
      git clone "https://github.com/$plugin" "$dest" || {
        echo -e "${YELLOW}Warning: failed to clone $plugin${NC}"
      }
    fi
  done

  write_zshrc
  notify "Terminal setup complete"
}

set_stow() {
  echo -e "${BLUE}Stowing dotfiles...${NC}"
  local pkg stow_err
  for pkg_dir in "$DOTFILES_DIR"/*/; do
    [[ -d "$pkg_dir" ]] || continue
    pkg=$(basename "$pkg_dir")

    if stow --restow -d "$DOTFILES_DIR" -t "$HOME" "$pkg" 2>/dev/null; then
      echo -e "${GREEN}  ✓ $pkg${NC}"
    else
      stow_err=$(stow -d "$DOTFILES_DIR" -t "$HOME" "$pkg" 2>&1)
      echo "$stow_err" | grep "cannot stow" | sed 's/.*over existing target //;s/ since.*//' | \
        while read -r target; do
          [[ -n "$target" && -f "$HOME/$target" && ! -L "$HOME/$target" ]] && \
            mv "$HOME/$target" "$HOME/$target.bak.$(date +%s)"
        done
      stow --restow -d "$DOTFILES_DIR" -t "$HOME" "$pkg" && \
        echo -e "${GREEN}  ✓ $pkg (conflict resolved)${NC}" || \
        echo -e "${YELLOW}  Warning: could not stow $pkg${NC}"
    fi
  done
  notify "Dotfiles stowed"
}

write_zshrc() {
  mkdir -p "$DOTFILES_DIR/zsh"
  echo -e "${BLUE}Writing dotfiles/zsh/.zshrc...${NC}"

  cat > "$DOTFILES_DIR/zsh/.zshrc" << ZSHRC
fastfetch
export ZSH="\$HOME/.oh-my-zsh"
export TERM="xterm-256color"

# ── zsh-autosuggestions config (must be before omz source) ───────────────
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=244"
ZSH_AUTOSUGGEST_STRATEGY=(history completion)
ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE=20

DISABLE_UNTRACKED_FILES_DIRTY="true"
plugins=(git z zsh-autosuggestions zsh-syntax-highlighting)
source "\$ZSH/oh-my-zsh.sh"

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

# git identity auto-switches by directory:
#   ~/Development/Personal/ → siddiky.academic@gmail.com
#   ~/Development/Office/   → nur-e-alom.siddiky@questionpro.com

# OCI remote dev
alias oci="mosh --ssh='ssh -i ~/Development/Personal/OCI/ssh-key-2025-08-11.key' ubuntu@${OCI_IP}"
alias oci-ssh="ssh oci"

# VS Code CLI
export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:\$PATH"

# Node / JS
alias nr="npm run"
alias nd="npm run dev"
alias pi="pnpm install"
alias pd="pnpm dev"
alias pb="pnpm build"
alias px="pnpm exec"

# ── tools ────────────────────────────────────────────────────────────────
eval "\$(starship init zsh)"
source <(fzf --zsh)
eval "\$(fnm env --use-on-cd --shell zsh)"

# ── pnpm ─────────────────────────────────────────────────────────────────
export PNPM_HOME="\$HOME/Library/pnpm"
case ":\$PATH:" in
  *":\$PNPM_HOME:"*) ;;
  *) export PATH="\$PNPM_HOME:\$PATH" ;;
esac

# ── bun ──────────────────────────────────────────────────────────────────
export BUN_INSTALL="\$HOME/.bun"
export PATH="\$BUN_INSTALL/bin:\$PATH"
[[ -s "\$HOME/.bun/_bun" ]] && source "\$HOME/.bun/_bun"

# ── optional tools (guarded) ─────────────────────────────────────────────
[[ -f "\$HOME/.cargo/env" ]] && source "\$HOME/.cargo/env"
export PATH="\$HOME/.local/bin:\$PATH"

# ── history ──────────────────────────────────────────────────────────────
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory sharehistory incappendhistory extendedhistory
setopt histignorealldups histignorespace histignoredups histreduceblanks
ZSHRC

  echo -e "${GREEN}dotfiles/zsh/.zshrc written${NC}"
}

set_ssh() {
  echo -e "${BLUE}Setting up SSH keys...${NC}"
  mkdir -p ~/.ssh && chmod 700 ~/.ssh

  local ssh_keys=(
    "id_ed25519_personal:${PERSONAL_GH_USER}@macbook"
    "id_ed25519_qp:${WORK_GH_USER}@macbook"
  )

  for key in "${ssh_keys[@]}"; do
    IFS=':' read -r filename comment <<< "$key"
    if [[ ! -f "$HOME/.ssh/$filename" ]]; then
      ssh-keygen -t ed25519 -C "$comment" -f "$HOME/.ssh/$filename" -N "" || {
        echo -e "${YELLOW}Warning: failed to generate $filename${NC}"
        log_action "Failed SSH key: $filename"
      }
      echo -e "${GREEN}Add this key to GitHub → Settings → SSH keys:${NC}"
      cat "$HOME/.ssh/$filename.pub"
      ssh-add --apple-use-keychain "$HOME/.ssh/$filename" 2>/dev/null || ssh-add "$HOME/.ssh/$filename"
    else
      echo -e "${GREEN}SSH key $filename already exists.${NC}"
      ssh-add --apple-use-keychain "$HOME/.ssh/$filename" 2>/dev/null || true
    fi
  done

  cat > "$HOME/.ssh/config" << EOF
# --- WORK ACCOUNT (QP) ---
Host github.com-qp
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_qp
    AddKeysToAgent yes
    UseKeychain yes

# --- PERSONAL ACCOUNT ---
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    AddKeysToAgent yes
    UseKeychain yes

# --- OCI Remote Dev (Personal) ---
Host oci
    HostName ${OCI_IP}
    User ubuntu
    IdentityFile ~/Development/Personal/OCI/ssh-key-2025-08-11.key
    AddKeysToAgent yes
    UseKeychain yes
    ServerAliveInterval 60
EOF

  chmod 600 "$HOME/.ssh/config"
  notify "SSH setup complete"
}

set_dev_dirs() {
  echo -e "${BLUE}Creating development directory structure...${NC}"
  mkdir -p "$HOME/Development/Personal/OCI"
  mkdir -p "$HOME/Development/Office"
  echo -e "${GREEN}Created ~/Development/Personal/ and ~/Development/Office/${NC}"
}

set_mac_defaults() {
  echo -e "${BLUE}Applying macOS defaults...${NC}"

  # Dock — instant autohide, no recents, only open apps
  defaults write com.apple.dock autohide -bool true
  defaults write com.apple.dock autohide-time-modifier -int 0
  defaults write com.apple.dock autohide-delay -float 0
  defaults write com.apple.dock show-recents -bool false
  defaults write com.apple.dock static-only -bool true
  defaults write com.apple.dock expose-group-apps -bool true
  defaults write NSGlobalDomain _HIHideMenuBar -bool true
  killall Dock

  # Finder — list view, show extensions, show path bar
  defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv"
  defaults write NSGlobalDomain AppleShowAllExtensions -bool true
  defaults write com.apple.finder ShowPathbar -bool true
  killall Finder

  # Keyboard — fast key repeat (essential for Neovim)
  defaults write -g ApplePressAndHoldEnabled -bool false
  defaults write -g InitialKeyRepeat -int 15
  defaults write -g KeyRepeat -int 1
  defaults write NSGlobalDomain AppleKeyboardUIMode -int 2

  # Spaces — don't span displays
  defaults write com.apple.spaces spans-displays -bool false && killall SystemUIServer

  notify "macOS defaults applied"
}

# ── Run all ────────────────────────────────────────────────────────────────
set_homebrew
set_apps
set_node
set_dev_dirs
set_gitconfig
set_dotfiles
set_stow
set_ssh
set_mac_defaults
