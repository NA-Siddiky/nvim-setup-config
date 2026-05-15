#!/bin/bash

# ── Config (keep in sync with macinstall.sh) ──────────────────────────────
PERSONAL_GH_USER="Nur-E-Alom Siddiky"
PERSONAL_EMAIL="siddiky.academic@gmail.com"
WORK_GH_USER="na-siddiky-qp"
WORK_EMAIL="nur-e-alom.siddiky@questionpro.com"
# ──────────────────────────────────────────────────────────────────────────

RED='\033[31m'; GREEN='\033[32m'; BLUE='\033[34m'; YELLOW='\033[33m'; NC='\033[0m'
ARCH=$(uname -m)   # aarch64 or x86_64

log_action() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$HOME/setup.log" 2>/dev/null
}

notify() {
  log_action "$1"
  echo -e "${GREEN}✓ $1${NC}"
}

gh_latest_release() {
  curl -s "https://api.github.com/repos/$1/releases/latest" | grep '"tag_name"' | cut -d'"' -f4
}

set_apt() {
  echo -e "${BLUE}Updating system packages...${NC}"
  sudo apt-get update -qq && sudo apt-get upgrade -y -qq || {
    echo -e "${RED}Error: apt update failed${NC}"
    return 1
  }

  local packages=(
    zsh git curl wget build-essential stow tmux mosh
    ripgrep fd-find bat jq unzip xclip
  )

  for pkg in "${packages[@]}"; do
    sudo apt-get install -y -qq "$pkg" || {
      echo -e "${YELLOW}  Warning: $pkg failed${NC}"
      log_action "Failed apt: $pkg"
    }
  done

  # Ubuntu names these differently — create consistent aliases
  mkdir -p "$HOME/.local/bin"
  [[ -x "$(command -v fdfind)" && ! -x "$HOME/.local/bin/fd" ]] && \
    ln -sf "$(which fdfind)" "$HOME/.local/bin/fd"
  [[ -x "$(command -v batcat)" && ! -x "$HOME/.local/bin/bat" ]] && \
    ln -sf "$(which batcat)" "$HOME/.local/bin/bat"

  notify "System packages installed"
}

set_neovim() {
  echo -e "${BLUE}Installing Neovim (stable)...${NC}"
  if command -v nvim >/dev/null 2>&1; then
    echo -e "${GREEN}Neovim already installed: $(nvim --version | head -1)${NC}"
    return 0
  fi
  sudo add-apt-repository ppa:neovim-ppa/stable -y 2>/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y neovim || {
    echo -e "${RED}Error: neovim install failed${NC}"
    return 1
  }
  notify "Neovim installed"
}

set_eza() {
  echo -e "${BLUE}Installing eza...${NC}"
  command -v eza >/dev/null 2>&1 && { echo -e "${GREEN}eza already installed${NC}"; return 0; }

  local version
  version=$(gh_latest_release "eza-community/eza")
  local gnu_arch="$ARCH-unknown-linux-gnu"
  local url="https://github.com/eza-community/eza/releases/download/${version}/eza_${gnu_arch}.tar.gz"

  local tmp
  tmp=$(mktemp -d)
  curl -fsSL "$url" | tar -xz -C "$tmp" 2>/dev/null && mv "$tmp/eza" "$HOME/.local/bin/" || {
    echo -e "${YELLOW}Warning: eza install failed${NC}"
    rm -rf "$tmp"
    return 1
  }
  rm -rf "$tmp"
  notify "eza installed"
}

set_lazygit() {
  echo -e "${BLUE}Installing lazygit...${NC}"
  command -v lazygit >/dev/null 2>&1 && { echo -e "${GREEN}lazygit already installed${NC}"; return 0; }

  local version
  version=$(gh_latest_release "jesseduffield/lazygit" | tr -d 'v')
  local lg_arch="$ARCH"
  [[ "$ARCH" == "aarch64" ]] && lg_arch="arm64"

  local tmp
  tmp=$(mktemp -d)
  curl -fsSL "https://github.com/jesseduffield/lazygit/releases/download/v${version}/lazygit_${version}_Linux_${lg_arch}.tar.gz" \
    | tar -xz -C "$tmp" && mv "$tmp/lazygit" "$HOME/.local/bin/" || {
    echo -e "${YELLOW}Warning: lazygit install failed${NC}"
    rm -rf "$tmp"
    return 1
  }
  rm -rf "$tmp"
  notify "lazygit installed"
}

set_git_delta() {
  echo -e "${BLUE}Installing git-delta...${NC}"
  command -v delta >/dev/null 2>&1 && { echo -e "${GREEN}git-delta already installed${NC}"; return 0; }

  local version
  version=$(gh_latest_release "dandavison/delta" | tr -d 'v')
  local deb_arch="$ARCH"
  [[ "$ARCH" == "x86_64" ]] && deb_arch="amd64"
  [[ "$ARCH" == "aarch64" ]] && deb_arch="arm64"

  local tmp
  tmp=$(mktemp -d)
  curl -fsSL "https://github.com/dandavison/delta/releases/download/${version}/git-delta_${version}_${deb_arch}.deb" \
    -o "$tmp/delta.deb" && sudo dpkg -i "$tmp/delta.deb" || {
    echo -e "${YELLOW}Warning: git-delta install failed${NC}"
    rm -rf "$tmp"
    return 1
  }
  rm -rf "$tmp"
  notify "git-delta installed"
}

set_gh_cli() {
  echo -e "${BLUE}Installing GitHub CLI...${NC}"
  command -v gh >/dev/null 2>&1 && { echo -e "${GREEN}gh already installed${NC}"; return 0; }

  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt-get update -qq && sudo apt-get install -y gh || {
    echo -e "${YELLOW}Warning: gh install failed${NC}"
    return 1
  }
  notify "GitHub CLI installed"
}

set_starship() {
  echo -e "${BLUE}Installing starship...${NC}"
  command -v starship >/dev/null 2>&1 && { echo -e "${GREEN}starship already installed${NC}"; return 0; }

  curl -fsSL https://starship.rs/install.sh | sh -s -- --yes || {
    echo -e "${YELLOW}Warning: starship install failed${NC}"
    return 1
  }
  notify "starship installed"
}

set_fzf() {
  echo -e "${BLUE}Installing fzf...${NC}"
  command -v fzf >/dev/null 2>&1 && { echo -e "${GREEN}fzf already installed${NC}"; return 0; }

  git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
  ~/.fzf/install --all --no-update-rc || {
    echo -e "${YELLOW}Warning: fzf install failed${NC}"
    return 1
  }
  notify "fzf installed"
}

set_fastfetch() {
  echo -e "${BLUE}Installing fastfetch...${NC}"
  command -v fastfetch >/dev/null 2>&1 && { echo -e "${GREEN}fastfetch already installed${NC}"; return 0; }

  sudo add-apt-repository ppa:zhangsongcui3371/fastfetch -y 2>/dev/null
  sudo apt-get update -qq && sudo apt-get install -y fastfetch || {
    echo -e "${YELLOW}Warning: fastfetch install failed${NC}"
    return 1
  }
  notify "fastfetch installed"
}

set_node() {
  echo -e "${BLUE}Setting up Node LTS via fnm...${NC}"

  if ! command -v fnm >/dev/null 2>&1; then
    curl -fsSL https://fnm.vercel.app/install | bash || {
      echo -e "${RED}Error: fnm install failed${NC}"
      return 1
    }
    export PATH="$HOME/.local/share/fnm:$PATH"
  fi

  eval "$(fnm env)"
  fnm install --lts && fnm use lts-latest && fnm default lts-latest || {
    echo -e "${YELLOW}Warning: Node LTS install failed${NC}"
    return 1
  }
  echo -e "${GREEN}Node $(node --version) ready${NC}"

  if ! command -v bun >/dev/null 2>&1; then
    curl -fsSL https://bun.sh/install | bash || echo -e "${YELLOW}Warning: bun install failed${NC}"
  fi

  # pnpm via npm after Node is ready
  if ! command -v pnpm >/dev/null 2>&1; then
    npm install -g pnpm || echo -e "${YELLOW}Warning: pnpm install failed${NC}"
  fi

  notify "Node + pnpm + bun installed"
}

set_dev_dirs() {
  echo -e "${BLUE}Creating development directory structure...${NC}"
  mkdir -p "$HOME/Development/Personal/OCI"
  mkdir -p "$HOME/Development/Office"
  echo -e "${GREEN}Created ~/Development/Personal/ and ~/Development/Office/${NC}"
}

set_gitconfig() {
  echo -e "${BLUE}Writing git config files...${NC}"

  cat > "$HOME/.gitconfig" << EOF
[user]
  name = Nur-e-alom Siddiky
[core]
  ignorecase = false
  excludesfile = ~/.gitignore_global
  pager = delta
[interactive]
  diffFilter = delta --color-only
[delta]
  navigate = true
  light = false
  side-by-side = true
[includeIf "gitdir/i:~/Development/Office/"]
  path = ~/.gitconfig-qp
[includeIf "gitdir/i:~/Development/Personal/"]
  path = ~/.gitconfig-personal
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
      return 1
    }
  else
    echo -e "${GREEN}oh-my-zsh already installed.${NC}"
  fi

  if [[ "$(getent passwd "$USER" | cut -d: -f7)" != "$(which zsh)" ]]; then
    chsh -s "$(which zsh)" "$USER" || \
      echo -e "${YELLOW}Warning: could not auto-set zsh shell. Run: chsh -s $(which zsh)${NC}"
  fi

  local zsh_custom=${ZSH_CUSTOM:-~/.oh-my-zsh/custom}
  local plugins=(
    "zsh-users/zsh-autosuggestions"
    "zsh-users/zsh-syntax-highlighting"
  )
  for plugin in "${plugins[@]}"; do
    local dest="$zsh_custom/plugins/${plugin##*/}"
    if [[ ! -d "$dest" ]]; then
      git clone "https://github.com/$plugin" "$dest" || \
        echo -e "${YELLOW}Warning: failed to clone $plugin${NC}"
    fi
  done

  write_zshrc
  notify "Terminal setup complete"
}

write_zshrc() {
  [[ -f "$HOME/.zshrc" ]] && cp "$HOME/.zshrc" "$HOME/.zshrc.bak.$(date +%s)"
  echo -e "${BLUE}Writing ~/.zshrc...${NC}"

  cat > "$HOME/.zshrc" << 'ZSHRC'
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
alias zc="nvim ~/.zshrc"
alias zs="source ~/.zshrc"
alias ls="eza"
alias ll="eza -la --git"
alias lt="eza --tree --level=2"
alias cat="bat --style=plain"

# Node / JS
alias nr="npm run"
alias nd="npm run dev"
alias pi="pnpm install"
alias pd="pnpm dev"
alias pb="pnpm build"
alias px="pnpm exec"

# ── tools ────────────────────────────────────────────────────────────────
eval "$(starship init zsh)"
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# ── fnm (Node version manager) ───────────────────────────────────────────
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env --use-on-cd --shell zsh)"

# ── pnpm ─────────────────────────────────────────────────────────────────
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# ── bun ──────────────────────────────────────────────────────────────────
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
[[ -s "$HOME/.bun/_bun" ]] && source "$HOME/.bun/_bun"

# ── local bin (eza, lazygit, fd, bat, etc.) ──────────────────────────────
export PATH="$HOME/.local/bin:$PATH"

# ── optional tools (guarded) ─────────────────────────────────────────────
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

# ── history ──────────────────────────────────────────────────────────────
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory sharehistory incappendhistory extendedhistory
setopt histignorealldups histignorespace histignoredups histreduceblanks
ZSHRC

  echo -e "${GREEN}~/.zshrc written (backup: .zshrc.bak.*)${NC}"
}

set_ssh() {
  echo -e "${BLUE}Setting up SSH keys...${NC}"
  mkdir -p ~/.ssh && chmod 700 ~/.ssh

  local ssh_keys=(
    "id_ed25519_personal:${PERSONAL_GH_USER}@ubuntu"
    "id_ed25519_qp:${WORK_GH_USER}@ubuntu"
  )

  for key in "${ssh_keys[@]}"; do
    IFS=':' read -r filename comment <<< "$key"
    if [[ ! -f "$HOME/.ssh/$filename" ]]; then
      ssh-keygen -t ed25519 -C "$comment" -f "$HOME/.ssh/$filename" -N "" || {
        echo -e "${YELLOW}Warning: failed to generate $filename${NC}"
      }
      echo -e "${GREEN}Add this key to GitHub → Settings → SSH keys:${NC}"
      cat "$HOME/.ssh/$filename.pub"
    else
      echo -e "${GREEN}SSH key $filename already exists.${NC}"
      ssh-add "$HOME/.ssh/$filename" 2>/dev/null || true
    fi
  done

  cat > "$HOME/.ssh/config" << 'EOF'
# --- WORK ACCOUNT (QP) ---
Host github.com-qp
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_qp
    AddKeysToAgent yes

# --- PERSONAL ACCOUNT ---
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    AddKeysToAgent yes
EOF

  chmod 600 "$HOME/.ssh/config"
  notify "SSH setup complete"
}

set_linux_defaults() {
  echo -e "${BLUE}Applying keyboard settings...${NC}"
  if command -v gsettings >/dev/null 2>&1; then
    gsettings set org.gnome.desktop.peripherals.keyboard repeat-interval 30 2>/dev/null || true
    gsettings set org.gnome.desktop.peripherals.keyboard delay 250 2>/dev/null || true
    echo -e "${GREEN}Keyboard repeat speed set.${NC}"
  else
    echo -e "${YELLOW}gsettings not available (headless/non-GNOME). Skipping.${NC}"
  fi
  notify "Linux defaults applied"
}

# ── Run all ────────────────────────────────────────────────────────────────
set_apt
set_neovim
set_eza
set_lazygit
set_git_delta
set_gh_cli
set_starship
set_fzf
set_fastfetch
set_node
set_dev_dirs
set_gitconfig
set_dotfiles
set_ssh
set_linux_defaults
