# Dev Setup — Nur-e-alom Siddiky

> One-script setup for React/Node development. Dual GitHub identities, OCI remote dev, Neovim. Runs on macOS, Ubuntu, and Windows.

---

## Supported platforms

| Platform | Script | Package manager |
|----------|--------|----------------|
| macOS (Apple Silicon M1/M2/M3) | `scripts/macinstall.sh` | Homebrew |
| Ubuntu 24.04 aarch64 (OCI / local) | `scripts/ubuntuinstall.sh` | apt + curl |
| Windows 11 | `scripts/wininstall.ps1` | winget + Scoop |

---

## Quick start — from zero on a new machine

### macOS

macOS ships with a system git that triggers Xcode CLI tools on first use. Nothing needs to be pre-installed.

```bash
# Step 1 — trigger Xcode CLI tools install if not done yet
git --version

# Step 2 — clone this repo via HTTPS (SSH isn't set up yet on a fresh machine)
git clone https://github.com/<your-gh-username>/nvim-setup-config ~/Development/Personal/nvim-setup-config
cd ~/Development/Personal/nvim-setup-config

# Step 3 — copy your OCI private key to the expected location
#           (skip if you don't use the OCI instance yet)
mkdir -p ~/Development/Personal/OCI
cp /path/to/ssh-key-2025-08-11.key ~/Development/Personal/OCI/ssh-key-2025-08-11.key
chmod 600 ~/Development/Personal/OCI/ssh-key-2025-08-11.key

# Step 4 — run the script (takes 10–20 min)
bash scripts/macinstall.sh

# Step 5 — restart terminal, then source config
source ~/.zshrc

# Step 6 — authenticate GitHub CLI (one-time, opens browser)
gh auth login
```

### Ubuntu 24.04 (OCI server or local)

```bash
# Step 1 — clone (Ubuntu has git and curl by default)
git clone https://github.com/<your-gh-username>/nvim-setup-config ~/nvim-setup-config
cd ~/nvim-setup-config

# Step 2 — run
bash scripts/ubuntuinstall.sh

# Step 3 — switch to zsh (if not already the default)
exec zsh

# Step 4 — stow all configs
cd ~/nvim-setup-config
stow -d dotfiles -t ~ zsh nvim tmux starship fastfetch

# Step 5 — authenticate GitHub CLI
gh auth login
```

> On the OCI instance: this gives you the same terminal experience as your Mac — same aliases, same Neovim, same prompt.

### Windows 11

```powershell
# Step 1 — open PowerShell 7 as Administrator

# Step 2 — clone
git clone https://github.com/<your-gh-username>/nvim-setup-config $env:USERPROFILE\Development\Personal\nvim-setup-config
cd $env:USERPROFILE\Development\Personal\nvim-setup-config

# Step 3 — run
Set-ExecutionPolicy Bypass -Scope Process -Force
powershell -ExecutionPolicy Bypass -File scripts\wininstall.ps1

# Step 4 — restart Windows Terminal

# Step 5 — authenticate GitHub CLI
gh auth login
```

---

## What the script does (execution order)

Each function runs in this exact order:

| Step | Function | What it does |
|------|----------|-------------|
| 1 | `set_homebrew` | Installs Homebrew, adds to `~/.zprofile` |
| 2 | `set_apps` | Installs all CLI tools and GUI apps, runs `brew cleanup` |
| 3 | `set_node` | Installs Node LTS via fnm, installs bun |
| 4 | `set_dev_dirs` | Creates `~/Development/Personal/OCI/` and `~/Development/Office/` |
| 5 | `set_gitconfig` | Writes `~/.gitconfig`, `~/.gitconfig-qp`, `~/.gitconfig-personal`, `~/.gitignore_global` |
| 6 | `set_dotfiles` | Adds Homebrew zsh to `/etc/shells`, installs oh-my-zsh, clones plugins, writes `dotfiles/zsh/.zshrc` |
| 7 | `set_stow` | Symlinks all `dotfiles/` packages to `~` via GNU Stow |
| 8 | `set_ssh` | Generates missing SSH keys, adds to Keychain, writes `~/.ssh/config` |
| 9 | `set_mac_defaults` | Applies Dock, Finder, and keyboard settings |

All actions are logged to `~/setup.log`.

---

## Directory structure

This is load-bearing — git auto-switches your identity based on which directory tree you're in.

```
~/Development/
├── Personal/                    → git identity: siddiky.academic@gmail.com
│   ├── nvim-setup-config/       ← this repo (all dotfiles live here)
│   ├── OCI/
│   │   └── ssh-key-2025-08-11.key  ← OCI instance private key
│   └── <other personal repos>/
└── Office/                      → git identity: nur-e-alom.siddiky@questionpro.com
    └── <QP repos>/
```

The script creates `Personal/OCI/` and `Office/` automatically. The OCI key must be copied manually (see Quick Start Step 3).

---

## Dotfiles architecture (stow)

All configs live inside this repo under `dotfiles/` and are symlinked to their expected locations by GNU Stow. Your entire dev environment is version-controlled.

```
dotfiles/
├── zsh/        → ~/.zshrc
├── nvim/       → ~/.config/nvim/ and ~/.config/nvim.12/
├── tmux/       → ~/.config/tmux/tmux.conf
├── starship/   → ~/.config/starship.toml
├── ghostty/    → ~/.config/ghostty/config
├── fastfetch/  → ~/.config/fastfetch/config.jsonc
├── pi/         → ~/.pi/
└── stow/       → ~/.stow-global-ignore
```

The `set_stow` step in the script handles this automatically, including backing up any conflicting files.

**Manual stow commands:**
```bash
# From repo root — stow all packages
stow -d dotfiles -t ~ zsh nvim tmux starship ghostty fastfetch pi stow

# Stow a single package
stow -d dotfiles -t ~ nvim

# Restow (refresh symlinks after adding files to a package)
stow --restow -d dotfiles -t ~ nvim

# Handle a conflict manually (back up then stow)
mv ~/.zshrc ~/.zshrc.bak
stow -d dotfiles -t ~ zsh
```

---

## What gets installed

### CLI tools

| Tool | Why you use it |
|------|---------------|
| **neovim** | Primary editor. `v` → custom `nvim.12` config (LSP, Telescope, mini.nvim). `vm` → vanilla neovim. |
| **fnm** | Fast Node Manager (40x faster than nvm). Auto-switches Node version per project on `cd` when `.nvmrc` is found. |
| **pnpm** | Package manager. Global content-addressed store — 10 projects sharing React 18 store it once. Strict dep resolution. `pi`, `pd`, `pb` aliases. |
| **bun** | JS runtime + test runner. `bun test` replaces Jest (up to 30x faster). `bun run` is a faster drop-in for `npm run`. |
| **lazygit** | Terminal git UI (`lg`). Use for: reviewing diffs before a PR, interactive rebase, staging individual hunks. |
| **gh** | GitHub CLI. `gh pr create`, `gh run watch`, `gh repo clone`. 90% of GitHub without a browser. Requires `gh auth login` after install. |
| **fzf** | Fuzzy finder. `Ctrl+R` → fuzzy history search. `Ctrl+T` → fuzzy file picker. Used by Neovim Telescope internally. |
| **tmux** | Terminal multiplexer. Critical for OCI: sessions persist after disconnect. Layout: NestJS left, Vite right, git bottom. |
| **eza** | Modern `ls`. `ll` shows git status icon per file. Color-coded by type. `lt` → directory tree. |
| **bat** | Syntax-highlighted `cat`. `cat routes.ts` reads like code with line numbers. |
| **fd** | Faster `find`. `fd -e tsx Button` — find `.tsx` files with "Button" in the name. |
| **ripgrep** | Fastest grep. `rg 'useEffect'` scans a full React codebase in under 100ms. Used by Neovim Telescope. |
| **jq** | JSON processor. `curl api/endpoint \| jq '.data[]'` — parse API responses in terminal. |
| **git-delta** | Syntax-highlighted git diffs. Used automatically by `git diff`, `git log -p`, `git show`. |
| **mosh** | SSH with roaming. Survives laptop sleep/wake and WiFi switches. Essential for OCI dev. |
| **starship** | Shell prompt. Shows: directory, git branch, Node version, exit code. Fast, zero config needed. |
| **stow** | Dotfile manager. Creates symlinks from `dotfiles/` to `~`. Keeps all configs version-controlled in this repo. |
| **tree-sitter** | Syntax parser. Required by Neovim for highlighting, code folding, and text objects. |
| **fastfetch** | System info at startup. Shows machine, CPU, RAM, Node version — useful for knowing what environment you're in. |

### GUI apps (macOS only)

| App | Why you use it |
|-----|---------------|
| **Ghostty** | Terminal emulator. GPU-accelerated, native macOS. Better color rendering for tmux and syntax highlighting. |
| **VS Code** | Editor with Remote SSH. `code .` opens current directory. Remote SSH connects to `oci` host for browser-free remote editing. |
| **Raycast** | Spotlight replacement. Clipboard history (`Cmd+Shift+V`), snippets, window manager, calculator, script runner. |
| **AltTab** | Window switcher. Switch between two Chrome windows, or two terminal windows — `Cmd+Tab` only shows apps, not windows. |
| **Shottr** | Screenshot tool. Pixel measurements, color picker, OCR (copy text from screenshots), annotations. |
| **Mos** | Mouse smoothing. Fixes jerky scroll for external mice (Logitech, etc.). Makes it feel like a trackpad. |

---

## Architecture

### Git identity: directory-based auto-switch

`~/.gitconfig` uses `includeIf` to conditionally load a sub-config based on working directory:

```ini
[includeIf "gitdir/i:~/Development/Office/"]
  path = ~/.gitconfig-qp          # na-siddiky-qp + QP email

[includeIf "gitdir/i:~/Development/Personal/"]
  path = ~/.gitconfig-personal    # Nur-E-Alom Siddiky + personal email
```

No manual switching needed — git picks the right identity based on where you are.

```bash
# Verify identity in any repo
git config user.email

# Expected results:
cd ~/Development/Personal/some-repo  # → siddiky.academic@gmail.com
cd ~/Development/Office/qp-repo      # → nur-e-alom.siddiky@questionpro.com
```

> Always clone repos to the right directory tree. A work repo cloned to `~/Desktop/` will use the base identity (no email set).

### SSH host architecture

| Host alias | Routes to | Key file | Used for |
|------------|-----------|----------|----------|
| `github.com-personal` | github.com | `~/.ssh/id_ed25519_personal` | Personal repos |
| `github.com-qp` | github.com | `~/.ssh/id_ed25519_qp` | QuestionPro repos |
| `oci` | 140.245.9.229 | `~/Development/Personal/OCI/ssh-key-2025-08-11.key` | OCI Ubuntu instance |

**Cloning with the right identity:**
```bash
# Personal repo — clone to Personal/ so git identity also activates
git clone git@github.com-personal:<username>/repo.git ~/Development/Personal/repo

# Work repo
git clone git@github.com-qp:questionpro-org/repo.git ~/Development/Office/repo
```

**Test all connections:**
```bash
ssh -T git@github.com-personal   # → Hi <personal-username>!
ssh -T git@github.com-qp         # → Hi na-siddiky-qp!
ssh oci                          # → connects to Ubuntu 24.04 OCI instance
```

### tmux on OCI: recommended session layout

```
┌─────────────────────────────────────────┐
│  session: expense-tracker               │
│                                         │
│  ┌──────────────────┬────────────────┐  │
│  │ pane 1           │ pane 2         │  │
│  │ NestJS :3000     │ Vite :5173     │  │
│  │ pnpm start:dev   │ pnpm dev       │  │
│  └──────────────────┴────────────────┘  │
│  ┌──────────────────────────────────┐   │
│  │ pane 3: git / docker / misc      │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

When you close your laptop or switch WiFi, the session keeps running. `oci` reconnects and `tmux attach` resumes exactly here.

---

## Daily workflows

### Local React/Node development

```bash
# New personal project
mkdir ~/Development/Personal/my-app && cd $_
git init
git config user.email    # verify: siddiky.academic@gmail.com
pi                       # pnpm install
pd                       # pnpm dev

# Work feature
cd ~/Development/Office/qp-project
git config user.email    # verify: nur-e-alom.siddiky@questionpro.com
git checkout -b feature/my-feature
pd                       # pnpm dev

# Open in VS Code
code .
```

### OCI remote development (expense-tracker-mono)

```bash
# Connect — mosh is persistent (survives sleep/WiFi change)
oci

# Fallback — plain SSH if mosh is unavailable
oci-ssh

# On the OCI instance
cd ~/expense-tracker-mono
tmux new-session -s dev    # first time
tmux attach -t dev         # returning
docker compose up -d postgres
pnpm run start:dev-all
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | https://app.140.245.9.229.nip.io/ |
| Backend (NestJS) | https://api.140.245.9.229.nip.io/ |
| Swagger UI | https://api.140.245.9.229.nip.io/api |
| Browser IDE | https://code.140.245.9.229.nip.io/ |

```bash
# VS Code Remote SSH (on your Mac — alternative to browser IDE)
# 1. Install "Remote - SSH" extension in VS Code
# 2. Cmd+Shift+P → "Remote-SSH: Connect to Host" → select "oci"
# No port forwarding needed — Caddy proxy handles all routing
```

### GitHub multi-account workflow

```bash
# gh must be authenticated first (one-time setup)
gh auth login

# Create a PR without opening a browser
gh pr create --title "feat: user auth" --body "..."
gh run watch          # watch CI in terminal
gh pr merge --squash

# Clone to the right location (git identity activates automatically)
gh repo clone questionpro-org/repo -- ~/Development/Office/repo
gh repo clone <personal-username>/repo -- ~/Development/Personal/repo
```

---

## Alias reference

### Editor

| Alias | Command | Purpose |
|-------|---------|---------|
| `v` | `NVIM_APPNAME=nvim.12 nvim` | Neovim with your full nvim.12 config |
| `vm` | `nvim` | Vanilla Neovim |
| `lg` | `lazygit` | Terminal git UI |

### Shell

| Alias | Command | Purpose |
|-------|---------|---------|
| `zc` | `nvim ~/.zshrc` | Edit shell config |
| `zs` | `source ~/.zshrc` | Reload shell config |
| `ls` | `eza` | Colorized file list |
| `ll` | `eza -la --git` | Long list with git status per file |
| `lt` | `eza --tree --level=2` | Directory tree, 2 levels deep |
| `cat` | `bat --style=plain` | Syntax-highlighted file viewer |

### Node / JS

| Alias | Command |
|-------|---------|
| `pi` | `pnpm install` |
| `pd` | `pnpm dev` |
| `pb` | `pnpm build` |
| `px` | `pnpm exec` |
| `nr` | `npm run` |
| `nd` | `npm run dev` |

### OCI

| Alias | Command |
|-------|---------|
| `oci` | `mosh --ssh='ssh -i ~/Development/Personal/OCI/ssh-key-2025-08-11.key' ubuntu@140.245.9.229` |
| `oci-ssh` | `ssh oci` (plain SSH fallback) |

---

## Post-run checklist

Run these after the script completes and you've opened a new terminal:

```bash
# ── Toolchain ──────────────────────────────────────────────────────────
node --version          # → v22.x (LTS)
pnpm --version          # → 9.x
bun --version           # → 1.x
nvim --version          # → NVIM v0.10.x
code --version          # → 1.9x.x

# ── Dotfiles (stow symlinks) ───────────────────────────────────────────
ls -la ~/.zshrc         # → symlink to .../dotfiles/zsh/.zshrc
ls -la ~/.config/nvim   # → symlink to .../dotfiles/nvim/.config/nvim

# ── Git identities ─────────────────────────────────────────────────────
git -C ~/Development/Personal config user.email
# → siddiky.academic@gmail.com

git -C ~/Development/Office config user.email
# → nur-e-alom.siddiky@questionpro.com

# ── GitHub SSH auth ────────────────────────────────────────────────────
ssh -T git@github.com-qp          # → Hi na-siddiky-qp!
ssh -T git@github.com-personal    # → Hi <your-username>!

# ── GitHub CLI ─────────────────────────────────────────────────────────
gh auth status                    # → Logged in to github.com as ...

# ── OCI connection ─────────────────────────────────────────────────────
oci-ssh                           # → ubuntu@...: Welcome to Ubuntu 24.04
```

**If personal GitHub SSH fails** — the public key isn't added to your account yet:
```bash
cat ~/.ssh/id_ed25519_personal.pub
# Copy output → github.com → Settings → SSH and GPG keys → New SSH key
```

**If `gh auth status` fails:**
```bash
gh auth login    # follow the browser prompts
```

---

## Troubleshooting

**`z oci` jumps to a directory instead of connecting**
`z` is the zsh-z directory jumper plugin. `z oci` matches the `~/Development/Personal/OCI/` directory you've visited. To connect to the OCI server, type `oci` (no `z`).

**`code` command not found**
VS Code is installed but the CLI isn't in PATH. This is already fixed in your `.zshrc`. If it still fails after `source ~/.zshrc`:
```bash
# Manually run once from inside VS Code:
# Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"
# OR verify the PATH export is in your .zshrc:
grep "Visual Studio Code" ~/.zshrc
```

**Autosuggestions not visible**
The suggestion color `fg=244` blends in on some terminal themes. Edit `~/.zshrc` (or `dotfiles/zsh/.zshrc`) and change:
```bash
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=8"     # lighter gray
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=white" # bright white
```
Then `zs` to reload.

**`mosh oci` fails — key not accessible**
The OCI key must be at `~/Development/Personal/OCI/ssh-key-2025-08-11.key`:
```bash
ls -la ~/Development/Personal/OCI/ssh-key-2025-08-11.key
chmod 600 ~/Development/Personal/OCI/ssh-key-2025-08-11.key
```

**`mosh oci` connects SSH but fails on mosh startup**
mosh is not installed on the OCI server:
```bash
ssh oci "sudo apt install mosh -y"
```
Also ensure UDP ports 60000–61000 are open: OCI Console → Networking → VCN → Security Lists → Ingress Rules → add UDP 60000-61000.

**Wrong git identity on a commit**
```bash
git config user.email          # check current identity
git remote -v                  # verify SSH host alias (should be github.com-qp or github.com-personal)
```
Fix an already-wrong commit before push:
```bash
git commit --amend --author="Nur-E-Alom Siddiky <siddiky.academic@gmail.com>" --no-edit
```

**`chsh: non-standard shell` during script**
Homebrew zsh wasn't in `/etc/shells`. The script handles this automatically by running:
```bash
echo "/opt/homebrew/bin/zsh" | sudo tee -a /etc/shells
```
If it still fails, run that manually then re-run the script.

**`brew` not found after install**
Homebrew PATH wasn't applied to the current session:
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```
Restart terminal. This is written to `~/.zprofile` by the script permanently.

**`node` not found after `set_node`**
fnm PATH isn't applied yet:
```bash
eval "$(fnm env)"
```
Permanent after `source ~/.zshrc`.

**SSH key passphrase prompt on every push**
Add keys to macOS Keychain:
```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_personal
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_qp
```

**Stow conflict on a package**
A real file exists at the target location (not a symlink):
```bash
# Back it up and restow
mv ~/.zshrc ~/.zshrc.bak
stow --restow -d dotfiles -t ~ zsh
```

---

## Maintaining this setup

```bash
# Update all Homebrew packages
brew update && brew upgrade && brew cleanup

# Update oh-my-zsh
omz update

# Update Neovim plugins
nvim --headless "+Lazy! update" +qa

# Check installed packages
brew list           # CLI tools
brew list --cask    # GUI apps

# Add a new config to dotfiles (example: adding a new tool config)
mkdir -p dotfiles/mytool/.config/mytool
mv ~/.config/mytool dotfiles/mytool/.config/mytool
stow -d dotfiles -t ~ mytool
# Now ~/.config/mytool is a symlink and the config is version-controlled
```

When you get a new Mac, the steps are exactly the same as **Quick Start → macOS**. The script is idempotent — re-running is safe. It skips what's already installed.
