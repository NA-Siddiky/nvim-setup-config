# Dev Setup — Nur-e-alom Siddiky

> One-script setup for React/Node development on Mac, Ubuntu (OCI), and Windows.
> Dual GitHub identities, Neovim, Ghostty, tmux. Every config is version-controlled in this repo.

---

## Supported platforms

| Platform | Script | Notes |
|----------|--------|-------|
| macOS Apple Silicon (M1/M2/M3) | `scripts/macinstall.sh` | Primary machine setup |
| Ubuntu 24.04 aarch64 — OCI / local | `scripts/ubuntuinstall.sh` | OCI remote dev server |
| Windows 11 | `scripts/wininstall.ps1` | Run in PowerShell 7 as Administrator |

---

## Dotfiles packages

Everything in `dotfiles/` is managed by GNU Stow. Each subfolder is a **package** — stow creates symlinks from it into `~`. This table is the single reference for all package operations.

| Package | Symlinks to | Platform | Reload after change |
|---------|------------|----------|-------------------|
| `zsh` | `~/.zshrc` | All | `source ~/.zshrc` (alias: `zs`) in every open tab |
| `nvim` | `~/.config/nvim/` and `~/.config/nvim.12/` | All | Close and reopen nvim |
| `tmux` | `~/.config/tmux/tmux.conf` | All | `tmux source ~/.config/tmux/tmux.conf` |
| `starship` | `~/.config/starship.toml` | All | `zs` or open a new terminal tab |
| `fastfetch` | `~/.config/fastfetch/config.jsonc` | All | Run `fastfetch` — immediate |
| `ghostty` | `~/.config/ghostty/config` | macOS only | `Cmd+Shift+,` inside Ghostty, or quit and reopen |
| `pi` | `~/.pi/` | All | Restart the pi agent |
| `stow` | `~/.stow-global-ignore` | All | No reload needed |

**To apply any dotfile change** (run from repo root):

```bash
cd ~/Development/Personal/nvim-setup-config

# Pattern: stow --restow -d dotfiles -t ~ <package>
stow --restow -d dotfiles -t ~ zsh
stow --restow -d dotfiles -t ~ ghostty
# ... same for any package in the table above
```

**To verify a symlink is wired up:**
```bash
# from: anywhere — use absolute paths
ls -la ~/.config/ghostty/config
# lrwxr-xr-x → .../dotfiles/ghostty/.config/ghostty/config  ← correct (symlink)
# -rw-r--r--  ← plain file — stow not run yet for this package
```

---

## Mac setup — step by step

### Step 1 — Install Xcode Command Line Tools

```bash
xcode-select --install
# A dialog appears — click Install. Takes 5–10 min.
git --version   # confirm: git version 2.x
```

### Step 2 — Clone this repo

SSH isn't set up yet, so use HTTPS:

```bash
mkdir -p ~/Development/Personal
git clone https://github.com/Nur-E-Alom/nvim-setup-config.git ~/Development/Personal/nvim-setup-config
cd ~/Development/Personal/nvim-setup-config
```

### Step 3 — Copy your OCI private key (skip if not using OCI)

```bash
mkdir -p ~/Development/Personal/OCI
cp /path/to/ssh-key-2025-08-11.key ~/Development/Personal/OCI/ssh-key-2025-08-11.key
chmod 600 ~/Development/Personal/OCI/ssh-key-2025-08-11.key
```

### Step 4 — Run the install script

```bash
# from: ~/Development/Personal/nvim-setup-config  (you are here after Step 2)
bash scripts/macinstall.sh
```

Takes 10–20 min. All actions are logged to `~/setup.log`.

Each step runs independently — if one fails, the rest continue. A summary at the end shows exactly what passed and what needs attention. The script is safe to re-run at any time, and you can target a single step without running everything:

```bash
# re-run one step
bash scripts/macinstall.sh set_ssh

# re-run multiple steps
bash scripts/macinstall.sh set_ssh set_stow set_fonts
```

What it does, in order:

| # | Function | What it does |
|---|----------|-------------|
| 1 | `set_homebrew` | Installs Homebrew, writes PATH to `~/.zprofile` |
| 2 | `set_apps` | Installs all CLI tools and GUI apps, runs `brew cleanup` |
| 3 | `set_node` | Installs Node LTS via fnm, installs bun |
| 4 | `set_dev_dirs` | Creates `~/Development/Personal/OCI/` and `~/Development/Office/` |
| 5 | `set_gitconfig` | Writes `~/.gitconfig`, identity sub-configs, `~/.gitignore_global` |
| 6 | `set_dotfiles` | Installs oh-my-zsh + plugins, writes `dotfiles/zsh/.zshrc` |
| 7 | `set_stow` | Symlinks all dotfiles packages to `~` — see package table above |
| 8 | `set_ssh` | Generates SSH keys, adds to Keychain, writes `~/.ssh/config` |
| 9 | `set_mac_defaults` | Applies Dock, Finder, and keyboard preferences |
| 10 | `set_vscode_finder_action` | Installs "Open in VS Code" right-click Quick Action in Finder |

### Step 5 — Restart the terminal

Close the window completely and open a new one. This loads Homebrew zsh, oh-my-zsh, and all aliases.

```bash
# from: anywhere — these are sanity checks after the terminal restarts
echo $SHELL          # → /opt/homebrew/bin/zsh
node --version       # → v22.x
```

### Step 6 — Authenticate GitHub CLI

```bash
# from: anywhere
gh auth login
# Choose: GitHub.com → HTTPS → Login with a web browser
```

### Step 7 — Add SSH keys to GitHub

The script generated two keys. Add their public keys to the matching GitHub account:

```bash
# from: anywhere
cat ~/.ssh/id_ed25519_personal.pub   # → add to your personal github.com account
cat ~/.ssh/id_ed25519_qp.pub         # → add to your QP github.com account
# Both via: github.com → Settings → SSH and GPG keys → New SSH key

# Test both connections
ssh -T git@github.com-personal   # → Hi Nur-E-Alom!
ssh -T git@github.com-qp         # → Hi na-siddiky-qp!
```

### Step 8 — Verify the full setup

```bash
# from: anywhere
node --version          # → v22.x
pnpm --version          # → 9.x
bun --version           # → 1.x
nvim --version          # → NVIM v0.10.x
code --version          # → 1.9x.x
gh auth status          # → Logged in to github.com as ...

# Dotfiles — confirm symlinks (should show → not plain files)
ls -la ~/.zshrc
ls -la ~/.config/nvim
ls -la ~/.config/ghostty/config

# Git identities — -C flag sets the directory without cd
git -C ~/Development/Personal config user.email   # → siddiky.academic@gmail.com
git -C ~/Development/Office   config user.email   # → nur-e-alom.siddiky@questionpro.com

# OCI (skip if key wasn't copied in Step 3)
oci-ssh                 # → ubuntu@... Welcome to Ubuntu 24.04
```

All green — setup is complete.

> **One-time manual steps after install:**
> - **Raycast folder search** — Raycast → `Cmd+,` → Extensions → File Search → enable **Folders**
> - **"Open in VS Code" Quick Action** — already installed by the script. If Finder doesn't show it yet, go to System Settings → Privacy & Security → Extensions → Finder Extensions and enable it, or log out and back in.

---

## Ubuntu setup (OCI server or local)

```bash
# from: ~ (home directory)
git clone https://github.com/Nur-E-Alom/nvim-setup-config.git ~/nvim-setup-config

# from: ~/nvim-setup-config
cd ~/nvim-setup-config
bash scripts/ubuntuinstall.sh   # takes 5–10 min

# from: anywhere — switch shell and authenticate
exec zsh
gh auth login
```

The Ubuntu script installs the same CLI tools via apt + direct downloads (no Homebrew). Dotfiles are written directly to `~` — stow is not used on the server.

---

## Windows setup

```powershell
# Step 1 — open PowerShell 7 as Administrator

# from: anywhere — clone the repo
git clone https://github.com/Nur-E-Alom/nvim-setup-config.git $env:USERPROFILE\Development\Personal\nvim-setup-config

# from: repo root — run the script
cd $env:USERPROFILE\Development\Personal\nvim-setup-config
Set-ExecutionPolicy Bypass -Scope Process -Force
powershell -ExecutionPolicy Bypass -File scripts\wininstall.ps1

# Step 4 — restart Windows Terminal

# from: anywhere
gh auth login
```

---

## Directory structure

This layout is load-bearing — git identity auto-switches based on which directory tree you're in.

```
~/Development/
├── Personal/                    → git identity: siddiky.academic@gmail.com
│   ├── nvim-setup-config/       ← this repo (all dotfiles live here)
│   ├── OCI/
│   │   └── ssh-key-2025-08-11.key  ← OCI private key (copy manually, Step 3)
│   └── <other personal repos>
└── Office/                      → git identity: nur-e-alom.siddiky@questionpro.com
    └── <QP repos>
```

---

## What gets installed

### CLI tools (all platforms)

| Tool | Why |
|------|-----|
| **neovim** | Primary editor. `v` → nvim.12 config (LSP + plugins). `vm` → vanilla. |
| **lazygit** | Terminal git UI (`lg`). Diff review, interactive rebase, hunk staging. |
| **gh** | GitHub CLI — `gh pr create`, `gh run watch`, `gh repo clone`. Requires `gh auth login`. |
| **fnm** | Fast Node Manager. Auto-switches Node version on `cd` when `.nvmrc` is present. |
| **pnpm** | Package manager with global content store — shared across projects. |
| **bun** | JS runtime + test runner. `bun test` is up to 30x faster than Jest. |
| **fzf** | Fuzzy finder — `Ctrl+R` for history, `Ctrl+T` for files. |
| **tmux** | Terminal multiplexer. Sessions persist on OCI after disconnect. |
| **eza** | Modern `ls`. `ll` shows git status per file. `lt` shows directory tree. |
| **bat** | Syntax-highlighted `cat`. |
| **fd** | Faster `find`. |
| **ripgrep** | Fastest grep. Used internally by Neovim Telescope. |
| **git-delta** | Syntax-highlighted diffs. Auto-used by `git diff`, `git log -p`. |
| **jq** | JSON processor. Parse API responses: `curl url \| jq '.data[]'`. |
| **mosh** | SSH with roaming — survives laptop sleep and WiFi changes. Essential for OCI. |
| **starship** | Shell prompt — directory, git branch, Node version, exit code. |
| **stow** | Dotfile manager — symlinks `dotfiles/` packages to `~`. |
| **fastfetch** | System info at shell startup. |

### GUI apps (macOS only)

| App | Why |
|-----|-----|
| **Ghostty** | GPU-accelerated terminal. Transparent titlebar with window controls visible. |
| **VS Code** | Editor + Remote SSH extension for editing directly on OCI. |
| **Raycast** | Spotlight replacement — clipboard history (`Cmd+Shift+V`), window manager, snippets, folder search. Needs one-time config — see Step 9C. |
| **AltTab** | Switches between windows of the same app (e.g. two Chrome windows). |
| **Shottr** | Screenshot with pixel ruler, color picker, OCR, annotations. |
| **Mos** | Mouse smoothing for external mice — makes scroll feel like a trackpad. |

---

## Architecture

### Git identity: directory-based auto-switch

`~/.gitconfig` uses `includeIf` to load a different sub-config based on working directory:

```ini
[includeIf "gitdir/i:~/Development/Office/"]
  path = ~/.gitconfig-qp          # na-siddiky-qp + QP email

[includeIf "gitdir/i:~/Development/Personal/"]
  path = ~/.gitconfig-personal    # Nur-E-Alom Siddiky + personal email
```

No manual switching needed. Always clone repos to the right directory tree — a work repo cloned to `~/Desktop/` will commit under the base identity (no email set).

```bash
# from: any git repo — check current identity
git config user.email

# from: ~/Development/Personal/some-repo
git config user.email   # → siddiky.academic@gmail.com

# from: ~/Development/Office/qp-repo
git config user.email   # → nur-e-alom.siddiky@questionpro.com
```

### SSH host architecture

| Host alias | Routes to | Key | Used for |
|------------|-----------|-----|----------|
| `github.com-personal` | github.com | `~/.ssh/id_ed25519_personal` | Personal repos |
| `github.com-qp` | github.com | `~/.ssh/id_ed25519_qp` | QuestionPro repos |
| `oci` | 140.245.9.229 | `~/Development/Personal/OCI/ssh-key-2025-08-11.key` | OCI Ubuntu instance |

**Always clone using the host alias, not bare `github.com`:**

```bash
# from: anywhere — destination path is explicit in the command
git clone git@github.com-personal:Nur-E-Alom/repo.git ~/Development/Personal/repo
git clone git@github.com-qp:questionpro-org/repo.git  ~/Development/Office/repo
```

---

## Daily workflows

### Local React/Node

```bash
# from: ~ — create and enter new project
mkdir ~/Development/Personal/my-app && cd $_
git init && git config user.email   # verify: siddiky.academic@gmail.com
pi && pd                            # pnpm install, then pnpm dev

# from: ~/Development/Office/qp-project
git checkout -b feature/my-feature
pd
```

### OCI remote development

```bash
# from: anywhere on your Mac — connect to OCI
oci          # via mosh (survives sleep/WiFi)
oci-ssh      # plain SSH fallback

# on the OCI server, from: ~/expense-tracker-mono
tmux new-session -s dev    # first time only
tmux attach -t dev         # returning to existing session
docker compose up -d postgres
pnpm run start:dev-all
```

| Service | URL |
|---------|-----|
| Frontend | https://app.140.245.9.229.nip.io/ |
| Backend | https://api.140.245.9.229.nip.io/ |
| Swagger | https://api.140.245.9.229.nip.io/api |
| Browser IDE | https://code.140.245.9.229.nip.io/ |

### GitHub multi-account

```bash
# from: your project directory (e.g. ~/Development/Office/qp-project)
gh pr create --title "feat: user auth" --body "..."
gh run watch
gh pr merge --squash

# from: anywhere — destination path is explicit
gh repo clone questionpro-org/repo -- ~/Development/Office/repo
gh repo clone Nur-E-Alom/repo      -- ~/Development/Personal/repo
```

---

## Alias reference

| Alias | Expands to | Purpose |
|-------|-----------|---------|
| `v` | `NVIM_APPNAME=nvim.12 nvim` | Neovim with full config |
| `vm` | `nvim` | Vanilla Neovim |
| `lg` | `lazygit` | Terminal git UI |
| `dev` | `bash .../scripts/dev.sh` | Launch 3-window tmux workspace |
| `zc` | `nvim ~/.zshrc` | Edit shell config |
| `zs` | `source ~/.zshrc` | Reload shell config |
| `ls` | `eza` | Colorized file list |
| `ll` | `eza -la --git` | Long list with git status |
| `lt` | `eza --tree --level=2` | Directory tree |
| `cat` | `bat --style=plain` | Syntax-highlighted viewer |
| `pi` | `pnpm install` | |
| `pd` | `pnpm dev` | |
| `pb` | `pnpm build` | |
| `px` | `pnpm exec` | |
| `nr` | `npm run` | |
| `nd` | `npm run dev` | |
| `oci` | `mosh ubuntu@140.245.9.229 ...` | Connect to OCI (persistent) |
| `oci-ssh` | `ssh oci` | Connect to OCI (plain SSH) |

---

## Utility scripts

Three helper scripts live in `scripts/`. None of these run automatically — call them when you need them.

### dev.sh — launch a full dev workspace

```bash
# from: your project directory
bash ~/Development/Personal/nvim-setup-config/scripts/dev.sh
```

Opens a tmux session named after the current directory with three pre-arranged windows:

| Window | What's in it |
|--------|-------------|
| **editor** | Neovim (`v .`) with the project root open |
| **dev** | Left pane (80%) free terminal · Right side: dev server on top, focused pane below |
| **git** | lazygit |

Dev server command is auto-detected from the lockfile (`bun dev` / `pnpm dev` / `npm run dev`). If the session already exists, running the script reattaches to it instead of creating a duplicate.

### note.sh — quick journal entry

```bash
# syntax
bash ~/Development/Personal/nvim-setup-config/scripts/note.sh <type> "<text #tags>"

# examples
bash ~/Development/Personal/nvim-setup-config/scripts/note.sh note "fix login redirect bug #backend"
bash ~/Development/Personal/nvim-setup-config/scripts/note.sh learn "tmux split-window -h splits vertically"
```

Or use the tmux popup shortcuts (works anywhere inside a tmux session):

| Key | What it does |
|-----|-------------|
| `M-n` | Opens a prompt → saves as a **note** entry |
| `M-l` | Opens a prompt → saves as a **learn** entry |

Entries are saved to `~/Documents/Notes/Mindflayer/QuickNotes/YYYY.md`, sorted under `## Month` → `### Day Weekday` headings.

### pokemon-bg.sh — Ghostty background image

```bash
# random Pokemon
bash ~/Development/Personal/nvim-setup-config/scripts/pokemon-bg.sh

# specific Pokemon by Pokédex number
bash ~/Development/Personal/nvim-setup-config/scripts/pokemon-bg.sh 25   # Pikachu
bash ~/Development/Personal/nvim-setup-config/scripts/pokemon-bg.sh 59   # Arcanine
```

Downloads official artwork from PokeAPI, caches it in `~/Pictures/pokemon_bg/`, resizes to 1000×1000, and updates the `background-image` line in `dotfiles/ghostty/.config/ghostty/config`. Ghostty picks it up on next launch (or `Cmd+Shift+,` to reload in-place).

---

## Troubleshooting

**Ghostty shows no minimize/maximize/close buttons**
The config has `macos-titlebar-style = transparent` but Ghostty must reload it. See the dotfiles package table above — `ghostty` package, reload with `Cmd+Shift+,`. If the file is not a symlink yet:
```bash
cd ~/Development/Personal/nvim-setup-config
stow --restow -d dotfiles -t ~ ghostty
# Then Cmd+Shift+, inside Ghostty, or quit and reopen
```

**Dock only shows open apps (not pinned apps)**
```bash
# from: anywhere
defaults delete com.apple.dock static-only && killall Dock
```

**`z oci` jumps to a directory instead of connecting**
`z` is the directory jumper plugin — it matched `~/Development/Personal/OCI/`. To connect to the server, type `oci` (no `z`).

**`code` command not found**
```bash
# from: anywhere
grep "Visual Studio Code" ~/.zshrc   # confirm PATH entry is present
# If still missing: inside VS Code → Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"
```

**Autosuggestions not visible**
`fg=244` blends in on some themes. Open the zsh dotfile:
```bash
# from: anywhere
zc   # opens dotfiles/zsh/.zshrc in nvim (via symlink)
```
Change the highlight line:
```
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=8"     # lighter
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=white" # bright
```
Then `zs` to reload.

**`mosh oci` fails — key not found**
```bash
# from: anywhere
ls -la ~/Development/Personal/OCI/ssh-key-2025-08-11.key
chmod 600 ~/Development/Personal/OCI/ssh-key-2025-08-11.key
```

**`mosh oci` connects SSH then fails**
mosh not on the server:
```bash
# from: anywhere on your Mac
ssh oci "sudo apt install mosh -y"
# Also ensure UDP 60000–61000 is open: OCI Console → Networking → VCN → Security Lists
```

**Wrong git identity on a commit**
```bash
# from: the project repo directory
git config user.email       # check current identity
git remote -v               # verify SSH host alias is github.com-qp or github.com-personal
# Fix before push:
git commit --amend --author="Nur-E-Alom Siddiky <siddiky.academic@gmail.com>" --no-edit
```

**`brew` not found after install**
```bash
# from: anywhere
eval "$(/opt/homebrew/bin/brew shellenv)"   # apply for this session
# Permanent: already written to ~/.zprofile — restart terminal
```

**`node` not found after setup**
```bash
# from: anywhere
eval "$(fnm env)"   # apply for this session
# Permanent: already in ~/.zshrc — run `zs`
```

**SSH key passphrase prompt on every push**
```bash
# from: anywhere
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_personal
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_qp
```

**Personal GitHub SSH fails after adding key**
```bash
# from: anywhere
cat ~/.ssh/id_ed25519_personal.pub
# Copy → github.com → Settings → SSH and GPG keys → New SSH key
```

**Stow conflict on a package**
```bash
# from: ~/Development/Personal/nvim-setup-config
mv ~/.zshrc ~/.zshrc.bak
stow --restow -d dotfiles -t ~ zsh
```

---

## Applying updates to your existing setup

Use this any time you pull new changes from the repo, or after you edit a dotfile directly.

### After `git pull` (someone updated the repo)

```bash
# from: ~/Development/Personal/nvim-setup-config
git pull

# Restow any packages whose files changed
stow --restow -d dotfiles -t ~ <package>   # see dotfiles package table at the top

# Then reload the app for that package — see the reload column in the package table
```

### After you edit a dotfile yourself

Same two steps: restow the package, reload the app. The dotfiles package table at the top of this README is the reference for both.

```bash
# Example: you edited dotfiles/ghostty/.config/ghostty/config
# from: ~/Development/Personal/nvim-setup-config
stow --restow -d dotfiles -t ~ ghostty
# Then: Cmd+Shift+, inside Ghostty to reload
```

### After you run `bash scripts/macinstall.sh` again

The script is fully idempotent — safe to re-run on an existing machine at any time:
- Homebrew skips already-installed packages
- oh-my-zsh and plugins skip if already present
- SSH keys skip if already exist
- `dotfiles/zsh/.zshrc` skips if already exists (protects your manual edits)
- All `defaults write` and stow commands re-apply cleanly

Re-run it when you want to: pull in script updates, reset macOS defaults, or refresh all symlinks at once.

---

## Maintenance

```bash
# from: anywhere
brew update && brew upgrade && brew cleanup   # update all Homebrew packages
omz update                                    # update oh-my-zsh
nvim --headless "+Lazy! update" +qa           # update Neovim plugins
```

Adding a new tool config to dotfiles:
```bash
# from: ~/Development/Personal/nvim-setup-config
mkdir -p dotfiles/mytool/.config/mytool
mv ~/.config/mytool dotfiles/mytool/.config/mytool
stow -d dotfiles -t ~ mytool
# ~/.config/mytool is now a symlink — config is version-controlled in this repo
```

On a new Mac: repeat from **Mac setup Step 1**. The script is idempotent — re-running skips what's already installed.
