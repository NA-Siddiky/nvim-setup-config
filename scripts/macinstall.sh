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

  # stow the 'stow' package first so ~/.stow-global-ignore is active for all subsequent packages
  stow --restow -d "$DOTFILES_DIR" -t "$HOME" stow 2>/dev/null || true

  local pkg stow_err
  for pkg_dir in "$DOTFILES_DIR"/*/; do
    [[ -d "$pkg_dir" ]] || continue
    pkg=$(basename "$pkg_dir")
    [[ "$pkg" == "stow" ]] && continue  # already done above

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
  # Fix any stale hardcoded username paths left in configs (e.g. from another machine)
  local ghostty_conf="$HOME/.config/ghostty/config"
  if [[ -f "$ghostty_conf" ]]; then
    sed -i '' "s|/Users/[^/]*/|$HOME/|g" "$ghostty_conf"
  fi

  notify "Dotfiles stowed"
}

write_zshrc() {
  mkdir -p "$DOTFILES_DIR/zsh"
  if [[ -f "$DOTFILES_DIR/zsh/.zshrc" ]]; then
    echo -e "${GREEN}dotfiles/zsh/.zshrc already exists — skipping (edit it directly to make changes)${NC}"
    return 0
  fi
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
alias dev="bash ~/Development/Personal/nvim-setup-config/scripts/dev.sh"
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

# VS Code CLI (macOS only)
[[ -d "/Applications/Visual Studio Code.app" ]] && \
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

set_fonts() {
  echo -e "${BLUE}Installing fonts...${NC}"
  # Nerd Font required for terminal icons (starship prompt, nvim, etc.)
  brew install --cask font-jetbrains-mono-nerd-font 2>/dev/null || \
    echo -e "${YELLOW}  Warning: font-jetbrains-mono-nerd-font failed${NC}"
  notify "Fonts installed"
}

set_mac_defaults() {
  echo -e "${BLUE}Applying macOS defaults...${NC}"

  # Dock — instant autohide, no recents, pinned + open apps (default behavior)
  defaults write com.apple.dock autohide -bool true
  defaults write com.apple.dock autohide-time-modifier -int 0
  defaults write com.apple.dock autohide-delay -float 0
  defaults write com.apple.dock show-recents -bool false
  defaults write com.apple.dock static-only -bool false
  defaults write com.apple.dock expose-group-apps -bool true
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
  defaults write com.apple.spaces spans-displays -bool false
  killall SystemUIServer

  notify "macOS defaults applied"
}

set_vscode_finder_action() {
  echo -e "${BLUE}Setting up 'Open in VS Code' Finder Quick Action...${NC}"

  local svc="$HOME/Library/Services/Open in VS Code.workflow"

  if [[ -d "$svc" ]]; then
    echo -e "${GREEN}'Open in VS Code' Quick Action already exists.${NC}"
    return 0
  fi

  mkdir -p "$svc/Contents"

  cat > "$svc/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>English</string>
    <key>CFBundleIdentifier</key>
    <string>com.apple.automator.Open in VS Code</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Open in VS Code</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>NSServices</key>
    <array>
        <dict>
            <key>NSMenuItem</key>
            <dict>
                <key>default</key>
                <string>Open in VS Code</string>
            </dict>
            <key>NSSendFileTypes</key>
            <array>
                <string>public.item</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
PLIST

  cat > "$svc/Contents/document.wflow" << 'WFLOW'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>AMApplicationBuild</key>
    <string>521.1</string>
    <key>AMApplicationVersion</key>
    <string>2.10</string>
    <key>AMDocumentVersion</key>
    <string>2</string>
    <key>actions</key>
    <array>
        <dict>
            <key>action</key>
            <dict>
                <key>AMAccepts</key>
                <dict>
                    <key>Container</key>
                    <string>List</string>
                    <key>Optional</key>
                    <true/>
                    <key>Types</key>
                    <array>
                        <string>com.apple.cocoa.path</string>
                    </array>
                </dict>
                <key>AMActionVersion</key>
                <string>2.0.3</string>
                <key>AMApplication</key>
                <array>
                    <string>Automator</string>
                </array>
                <key>AMParameterProperties</key>
                <dict>
                    <key>COMMAND_STRING</key>
                    <dict/>
                    <key>CheckedForUserDefaultShell</key>
                    <dict/>
                    <key>inputMethod</key>
                    <dict/>
                    <key>shell</key>
                    <dict/>
                    <key>source</key>
                    <dict/>
                </dict>
                <key>AMProvides</key>
                <dict>
                    <key>Container</key>
                    <string>List</string>
                    <key>Types</key>
                    <array>
                        <string>com.apple.cocoa.path</string>
                    </array>
                </dict>
                <key>ActionBundlePath</key>
                <string>/System/Library/Automator/Run Shell Script.action</string>
                <key>ActionName</key>
                <string>Run Shell Script</string>
                <key>ActionParameters</key>
                <dict>
                    <key>COMMAND_STRING</key>
                    <string>open -a "Visual Studio Code" "$@"</string>
                    <key>CheckedForUserDefaultShell</key>
                    <true/>
                    <key>inputMethod</key>
                    <integer>1</integer>
                    <key>shell</key>
                    <string>/bin/bash</string>
                    <key>source</key>
                    <string></string>
                </dict>
                <key>BundleIdentifier</key>
                <string>com.apple.automator.runshellscript</string>
                <key>CFBundleVersion</key>
                <string>2.0.3</string>
                <key>CanShowSelectedItemsWhenRun</key>
                <false/>
                <key>CanShowWhenRun</key>
                <true/>
                <key>Category</key>
                <array>
                    <string>AMCategoryUtilities</string>
                </array>
                <key>Class Name</key>
                <string>RunShellScriptAction</string>
                <key>InputUUID</key>
                <string>1C2D8E3F-4A5B-6C7D-8E9F-0A1B2C3D4E5F</string>
                <key>Keywords</key>
                <array>
                    <string>Shell</string>
                    <string>Script</string>
                    <string>Command</string>
                    <string>Run</string>
                    <string>Unix</string>
                </array>
                <key>OutputUUID</key>
                <string>2D3E4F5A-6B7C-8D9E-0F1A-2B3C4D5E6F7A</string>
                <key>UUID</key>
                <string>3E4F5A6B-7C8D-9E0F-1A2B-3C4D5E6F7A8B</string>
                <key>UnlockPassword</key>
                <string></string>
                <key>UserDefinedFields</key>
                <dict/>
                <key>isViewVisible</key>
                <true/>
                <key>localizedActionDescription</key>
                <string>Run a shell script with the text passed to it as input.</string>
                <key>localizedActionName</key>
                <string>Run Shell Script</string>
                <key>localizedBundleName</key>
                <string>Run Shell Script</string>
                <key>localizedDescription</key>
                <string>Run a shell script with the text passed to it as input.</string>
                <key>localizedName</key>
                <string>Run Shell Script</string>
                <key>localizedSummary</key>
                <string>Run Shell Script with shell: /bin/bash</string>
                <key>unlockDescription</key>
                <string></string>
            </dict>
        </dict>
    </array>
    <key>connectors</key>
    <dict/>
    <key>workflowMetaData</key>
    <dict>
        <key>applicationBundleIDsByPath</key>
        <dict/>
        <key>applicationPaths</key>
        <array/>
        <key>inputTypeIdentifier</key>
        <string>com.apple.Automator.fileSystemObject</string>
        <key>outputTypeIdentifier</key>
        <string>com.apple.Automator.nothing</string>
        <key>presentationMode</key>
        <integer>11</integer>
        <key>processesInput</key>
        <false/>
        <key>serviceInputTypeIdentifier</key>
        <string>com.apple.Automator.fileSystemObject</string>
        <key>serviceOutputTypeIdentifier</key>
        <string>com.apple.Automator.nothing</string>
        <key>serviceProcessesInput</key>
        <false/>
        <key>ubiquitous</key>
        <false/>
        <key>workflowTypeIdentifier</key>
        <string>com.apple.Automator.servicesMenu</string>
    </dict>
</dict>
</plist>
WFLOW

  /System/Library/CoreServices/pbs -update 2>/dev/null || true
  notify "'Open in VS Code' Quick Action installed"
}

# ── Step runner ───────────────────────────────────────────────────────────
ALL_STEPS=(
  set_homebrew
  set_apps
  set_node
  set_dev_dirs
  set_gitconfig
  set_dotfiles
  set_stow
  set_ssh
  set_fonts
  set_mac_defaults
  set_vscode_finder_action
)

FAILED_STEPS=()

run_step() {
  local fn="$1"
  echo -e "\n${BLUE}━━━ $fn ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  if "$fn"; then
    echo -e "${GREEN}✓ $fn done${NC}"
  else
    FAILED_STEPS+=("$fn")
    echo -e "${RED}✗ $fn failed — skipping, continuing with next step${NC}"
    log_action "FAILED: $fn"
  fi
}

print_summary() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  if [[ ${#FAILED_STEPS[@]} -eq 0 ]]; then
    echo -e "${GREEN}Setup complete — all steps passed.${NC}"
    notify "Mac setup finished successfully"
  else
    echo -e "${YELLOW}Setup finished with issues in the following steps:${NC}"
    for fn in "${FAILED_STEPS[@]}"; do
      echo -e "  ${RED}✗  $fn${NC}"
    done
    echo ""
    echo -e "${YELLOW}Re-run a single step:   bash scripts/macinstall.sh <step_name>${NC}"
    echo -e "${YELLOW}Run multiple steps:     bash scripts/macinstall.sh set_ssh set_stow${NC}"
    echo -e "${YELLOW}Full log:               ~/setup.log${NC}"
    notify "Mac setup finished with errors — check setup.log"
  fi
}

# ── Run: all steps, or only the ones passed as arguments ──────────────────
if [[ $# -gt 0 ]]; then
  for step in "$@"; do
    if declare -f "$step" > /dev/null 2>&1; then
      run_step "$step"
    else
      echo -e "${RED}Unknown step: $step${NC}"
      echo -e "${YELLOW}Available: ${ALL_STEPS[*]}${NC}"
    fi
  done
else
  for step in "${ALL_STEPS[@]}"; do
    run_step "$step"
  done
fi

print_summary
