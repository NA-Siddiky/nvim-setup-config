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

macOS ships with a system git (triggers Xcode CLI tools on first use). You don't need anything pre-installed.

```bash
# Step 1 — accept Xcode CLI tools if prompted
git --version

# Step 2 — clone this repo (use HTTPS on first clone, SSH isn't set up yet)
git clone https://github.com/<your-gh-username>/nvim-setup-config ~/Development/Personal/nvim-setup-config
cd ~/Development/Personal/nvim-setup-config

# Step 3 — update your OCI key path if different (line 13)
vim scripts/macinstall.sh

# Step 4 — run
bash scripts/macinstall.sh

# Step 5 — restart terminal, then verify
source ~/.zshrc
node --version       # → v22.x
git config user.email  # → depends on which directory you're in
```

### Ubuntu 24.04 (OCI or local)

```bash
# Step 1 — clone (Ubuntu has git and curl by default)
git clone https://github.com/<your-gh-username>/nvim-setup-config ~/nvim-setup-config
cd ~/nvim-setup-config

# Step 2 — run
bash scripts/ubuntuinstall.sh

# Step 3 — switch to zsh and restart
exec zsh
```

> On the OCI instance: this gives you the same terminal experience as your Mac — same aliases, same neovim, same prompt.

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
```

---

## Directory structure

This is load-bearing — git auto-switches your identity based on which tree you're in.

```
~/Development/
├── Personal/              → git identity: siddiky.academic@gmail.com
│   ├── nvim-setup-config/ ← this repo (dotfiles live here)
│   ├── OCI/               → OCI remote dev projects
│   └── <other repos>/
└── Office/                → git identity: nur-e-alom.siddiky@questionpro.com
    └── <QP repos>/
```

The setup script creates `Personal/OCI/` and `Office/` automatically.

---

## Dotfiles architecture (stow)

All configs live in `dotfiles/` inside this repo and are symlinked to their expected locations by GNU Stow. This means your entire dev environment is version-controlled.

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

**To stow all configs manually:**
```bash
# From repo root
stow -d dotfiles -t ~ zsh nvim tmux starship ghostty fastfetch pi stow
```

**To stow a single package:**
```bash
stow -d dotfiles -t ~ nvim
```

**If there's a conflict** (existing file at target that isn't a symlink):
```bash
mv ~/.zshrc ~/.zshrc.bak && stow -d dotfiles -t ~ zsh
```

The `set_stow` step in `macinstall.sh` handles this automatically — it backs up conflicting files and retries.

---

## What gets installed

### CLI tools — with your specific use cases

| Tool | Why you use it |
|------|---------------|
| **neovim** | Primary editor. `v` alias uses your `nvim.12` config (full LSP + plugins). `vm` runs vanilla neovim. |
| **fnm** | Fast Node Manager (written in Rust, 40x faster than nvm). Auto-switches Node version per project when it finds `.nvmrc` or `package.json > engines`. Essential since you work across multiple React/Node projects. |
| **pnpm** | Package manager with a global content-addressed store — if 10 projects use React 18, it's only stored once on disk. Strictly correct dependency resolution (no phantom deps). `pi`, `pd`, `pb` aliases. |
| **bun** | JavaScript runtime + test runner. Use `bun test` instead of Jest — up to 30x faster for unit tests. Also use `bun run` as a drop-in faster `npm run`. |
| **lazygit** | Terminal git UI. Most useful for: reviewing your own diff before a PR, interactive rebase to squash/reorder commits, staging individual diff hunks without memorizing `git add -p` flags. Launch with `lg` alias. |
| **gh** | GitHub CLI. `gh pr create`, `gh pr view --web`, `gh run watch`, `gh repo clone org/repo`. Lets you do 90% of GitHub actions without opening a browser. |
| **fzf** | Fuzzy finder. `Ctrl+R` → fuzzy search through 10k history entries instantly. `Ctrl+T` → fuzzy file picker. Used internally by Neovim Telescope. |
| **tmux** | Terminal multiplexer. Critical for OCI: sessions persist after laptop closes, SSH reconnects resume exactly where you left off. Layout: left pane NestJS dev server, right pane Vite dev server, bottom pane git. |
| **eza** | Modern `ls`. `ll` shows git status icon per file (M=modified, ?=untracked). Color-coded by file type. Tree view with `lt`. |
| **bat** | Syntax-highlighted `cat` with line numbers. `cat routes.ts` reads like code, not a wall of text. Good for quickly reading config files, checking `.env` format, etc. |
| **fd** | Faster `find`. `fd -e tsx Button` — find all `.tsx` files with "Button" in the name. Used by fzf internally. |
| **ripgrep** | Fastest grep. `rg 'useEffect'` scans an entire React codebase in under 100ms. Used by Neovim Telescope for live grep. |
| **jq** | JSON processor. `curl https://api.../endpoint \| jq '.data[]'` — parse and pretty-print API responses in terminal. Essential for REST debugging without Postman. |
| **git-delta** | Syntax-highlighted git diffs. Replaces the default diff viewer in `git diff`, `git log -p`, `git show`. Side-by-side view for large changes. |
| **mosh** | SSH with roaming. Unlike SSH, mosh survives laptop sleep/wake cycles and WiFi switches without reconnecting. Essential for OCI dev sessions. |
| **starship** | Shell prompt. Shows: current directory, git branch + status, Node version (only in JS projects), exit code. Zero config needed, fast. |
| **stow** | Dotfile manager. GNU Stow creates symlinks from `~/dotfiles/` to their expected locations (`~/.config/nvim`, etc). This repo's `dotfiles/` directory is managed by it. |
| **tree-sitter** | Syntax parser. Required by Neovim for accurate syntax highlighting, code folding, and text objects (select a function, etc). |
| **fastfetch** | System info at shell startup. Shows CPU, RAM, Node version, shell — useful to confirm what machine/environment you're on. |
| **lazygit** | See above. |
| **git-delta** | See above. |
| **mosh** | See above. |

### GUI apps (macOS only)

| App | Why you use it |
|-----|---------------|
| **Ghostty** | Terminal emulator. GPU-accelerated, native macOS rendering. Better color accuracy than iTerm2 — important for tmux and syntax highlighting. |
| **Raycast** | Spotlight replacement + productivity. Key features: clipboard history (`Cmd+Shift+V`), snippets for boilerplate code, window manager (thirds, halves), quick calculator, run shell scripts from launcher. |
| **AltTab** | Window switcher. `Cmd+Tab` shows apps, not windows. AltTab lets you switch between two Chrome windows, or two terminal windows, directly. Configurable to look like Windows Alt+Tab. |
| **Shottr** | Screenshot tool. Better than default macOS screenshots: pixel measurements, color picker, OCR (copy text from a screenshot), annotate with arrows/text. Map to `Cmd+Shift+1/2/3`. |
| **Mos** | Mouse smoothing. Fixes the default macOS scrolling for external mice (Logitech, etc.) — removes the jarring scroll acceleration. Smooth like a trackpad. |

---

## Architecture

### Git identity: directory-based auto-switch

`~/.gitconfig` uses `includeIf` to conditionally load a sub-config:

```ini
[includeIf "gitdir/i:~/Development/Office/"]
  path = ~/.gitconfig-qp          # na-siddiky-qp + QP email

[includeIf "gitdir/i:~/Development/Personal/"]
  path = ~/.gitconfig-personal    # Nur-E-Alom Siddiky + personal email
```

**No manual switching.** You never run a command to change identity — git picks it based on where you are.

```bash
# Verify current identity in any repo
git config user.email

# Expected:
cd ~/Development/Personal/some-repo  → siddiky.academic@gmail.com
cd ~/Development/Office/qp-repo      → nur-e-alom.siddiky@questionpro.com
```

> If you clone a work repo to `~/Desktop/` or anywhere outside `~/Development/Office/`, git will use the base identity (no email). Always clone to the right directory.

### SSH host architecture

Two separate GitHub identities, one OCI server:

| Host alias | Routes to | Key file | Used for |
|------------|-----------|----------|----------|
| `github.com-personal` | github.com | `id_ed25519_personal` | Personal repos |
| `github.com-qp` | github.com | `id_ed25519_qp` | QuestionPro repos |
| `oci` | 140.245.9.229 | `oci_aarch64` | OCI Ubuntu instance |

**Cloning with the right identity:**

```bash
# Personal repo (clone to Personal/ so git identity also activates)
git clone git@github.com-personal:<username>/repo.git ~/Development/Personal/repo

# Work repo
git clone git@github.com-qp:questionpro-org/repo.git ~/Development/Office/repo
```

**Test connections:**

```bash
ssh -T git@github.com-personal   # → Hi <personal-username>!
ssh -T git@github.com-qp         # → Hi na-siddiky-qp!
ssh oci                          # → connects to Ubuntu OCI instance
```

### tmux on OCI: recommended session layout

```
┌─────────────────────────────────────┐
│  window: expense-tracker            │
│                                     │
│ ┌───────────────┬───────────────┐   │
│ │ pane 1        │ pane 2        │   │
│ │ NestJS (3000) │ Vite (5173)   │   │
│ │ pnpm start:   │ pnpm dev      │   │
│ │ dev           │               │   │
│ └───────────────┴───────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ pane 3: git / misc commands   │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

When you disconnect (close laptop, switch WiFi), the session keeps running. `oci` or `oci-ssh` reconnects and `tmux attach` resumes exactly here.

---

## Daily workflows

### Local React/Node development

```bash
# Start a new personal project
mkdir ~/Development/Personal/my-app && cd $_
git init
git config user.email   # verify: siddiky.academic@gmail.com
pi                      # pnpm install
pd                      # pnpm dev

# Start work feature
cd ~/Development/Office/qp-project
git config user.email   # verify: nur-e-alom.siddiky@questionpro.com
git checkout -b feature/my-feature
pd                      # pnpm dev
```

### OCI remote development (expense-tracker-mono)

```bash
# Connect (persistent session, survives sleep/WiFi)
oci

# If mosh unavailable (first setup, or server restart)
oci-ssh

# On the OCI instance — start dev environment
cd ~/expense-tracker-mono
tmux new-session -s dev     # or: tmux attach -t dev
docker compose up -d postgres
pnpm run start:dev-all
```

| Service | URL |
|---------|-----|
| Frontend | https://app.140.245.9.229.nip.io/ |
| Backend API | https://api.140.245.9.229.nip.io/ |
| Swagger | https://api.140.245.9.229.nip.io/api |
| Browser IDE (code-server) | https://code.140.245.9.229.nip.io/ |

```bash
# VS Code Remote SSH alternative (on your Mac)
# Install "Remote - SSH" extension → connect to host "oci"
# No port forwarding needed — Caddy proxy handles the routing
```

### GitHub multi-account workflow

```bash
# Create a PR from terminal (no browser needed)
gh pr create --title "feat: add user auth" --body "..." 
gh run watch        # watch CI run in terminal
gh pr merge --squash

# Clone a repo to the right location (identity auto-follows)
gh repo clone questionpro-org/repo ~/Development/Office/repo
gh repo clone my-personal-username/repo ~/Development/Personal/repo
```

---

## Alias reference

### Shell

| Alias | Expands to | Purpose |
|-------|-----------|---------|
| `v` | `NVIM_APPNAME=nvim.12 nvim` | Open neovim with your custom nvim.12 config |
| `vm` | `nvim` | Open default neovim |
| `zc` | `nvim ~/.zshrc` | Edit shell config |
| `zs` | `source ~/.zshrc` | Reload shell config |
| `ls` | `eza` | Colorized file list |
| `ll` | `eza -la --git` | Long list with git status per file |
| `lt` | `eza --tree --level=2` | Directory tree, 2 levels |
| `cat` | `bat --style=plain` | Syntax-highlighted file view |

### Node / JS

| Alias | Expands to |
|-------|-----------|
| `pi` | `pnpm install` |
| `pd` | `pnpm dev` |
| `pb` | `pnpm build` |
| `px` | `pnpm exec` |
| `nr` | `npm run` |
| `nd` | `npm run dev` |

### OCI

| Alias | Expands to |
|-------|-----------|
| `oci` | `mosh ubuntu@140.245.9.229 --ssh='ssh -i ~/.ssh/oci_aarch64'` |
| `oci-ssh` | `ssh oci` (plain SSH fallback) |

---

## Post-run checklist

Run these after the script completes and you've restarted terminal:

```bash
# Node toolchain
node --version          # → v22.x (LTS)
pnpm --version          # → 9.x
bun --version           # → 1.x

# Git identities
cd ~/Development/Personal && git init tmp && cd tmp
git config user.email   # → siddiky.academic@gmail.com
cd ~ && rm -rf ~/Development/Personal/tmp

cd ~/Development/Office && git init tmp && cd tmp
git config user.email   # → nur-e-alom.siddiky@questionpro.com
cd ~ && rm -rf ~/Development/Office/tmp

# GitHub SSH auth
ssh -T git@github.com-qp        # → Hi na-siddiky-qp!
ssh -T git@github.com-personal  # → Hi <personal-username>!

# OCI
ssh oci                 # → should connect to Ubuntu 24.04 instance
```

**If personal GitHub SSH fails** — the `id_ed25519_personal.pub` key may not be added to your personal GitHub account yet:
```bash
cat ~/.ssh/id_ed25519_personal.pub
# Copy and add at: github.com → Settings → SSH and GPG keys → New SSH key
```

---

## Troubleshooting

**Autosuggestions not visible**
The suggestion color `fg=244` is a mid-gray. If your terminal background is dark gray it may blend in:
```bash
# Edit ~/.zshrc and change the highlight style
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=8"     # lighter gray
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=white" # bright white
```
Then `zs` to reload.

**Wrong git identity on a commit**
Check you cloned to the right directory:
```bash
git config user.email   # shows which identity is active
git remote -v           # check which SSH host alias is used
```
To fix an already-wrong commit (before push):
```bash
git commit --amend --author="Nur-E-Alom Siddiky <siddiky.academic@gmail.com>" --no-edit
```

**`brew` not found after install (macOS)**
Homebrew PATH wasn't applied. Run:
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```
Then restart terminal. This is added to `~/.zprofile` automatically by the script.

**mosh not connecting to OCI**
mosh must be installed on the server too:
```bash
ssh oci "sudo apt install mosh -y"
```
Also confirm UDP port 60000-61000 is open in the OCI security list (Network → Security Lists → Ingress Rules).

**`git config user.email` shows wrong email in a new directory**
The `includeIf` path must end with `/`. It's case-insensitive (`/i` flag). If you created `~/Development/office/` (lowercase) instead of `~/Development/Office/`, the match will still work due to the `/i` flag.

**node command not found after `set_node`**
fnm PATH wasn't applied to current session. Run:
```bash
eval "$(fnm env)"
```
This is permanent after `source ~/.zshrc`.

**SSH key passphrase prompt on every git push**
Keys should be added to macOS Keychain by `ssh-add --apple-use-keychain`. If it's prompting still:
```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_personal
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_qp
```

---

## Maintaining this setup

```bash
# Update all Homebrew packages
brew update && brew upgrade && brew cleanup

# Update oh-my-zsh
omz update

# Update neovim plugins
nvim --headless "+Lazy! update" +qa

# Check what's installed
brew list        # CLI packages
brew list --cask # GUI apps
```

When you get a new Mac, the steps are exactly the same as Quick Start → macOS above. The script is idempotent — re-running it is safe. It skips what's already installed.
