# Windows 11 dev setup
# Run in PowerShell 7+ as Administrator:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   powershell -ExecutionPolicy Bypass -File wininstall.ps1

# ── Config (keep in sync with macinstall.sh) ──────────────────────────────
$PERSONAL_GH_USER = "Nur-E-Alom Siddiky"
$PERSONAL_EMAIL   = "siddiky.academic@gmail.com"
$WORK_GH_USER     = "na-siddiky-qp"
$WORK_EMAIL       = "nur-e-alom.siddiky@questionpro.com"
$OCI_IP           = "140.245.9.229"
$OCI_KEY          = "$env:USERPROFILE\Development\Personal\OCI\ssh-key-2025-08-11.key"
# ──────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Continue"
$ProgressPreference    = "SilentlyContinue"

function Write-Step  { param($Msg) Write-Host $Msg -ForegroundColor Blue }
function Write-Ok    { param($Msg) Write-Host "✓ $Msg" -ForegroundColor Green }
function Write-Warn  { param($Msg) Write-Host "  Warning: $Msg" -ForegroundColor Yellow }
function Write-Err   { param($Msg) Write-Host "  Error: $Msg" -ForegroundColor Red }
function Log-Action  {
  param($Msg)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "[$ts] $Msg" | Add-Content "$env:USERPROFILE\setup.log" -ErrorAction SilentlyContinue
}

function Set-Scoop {
  Write-Step "Setting up Scoop..."
  if (Get-Command scoop -ErrorAction SilentlyContinue) {
    Write-Ok "Scoop already installed"
    return
  }
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
  Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
  scoop bucket add extras 2>$null
  scoop bucket add versions 2>$null
  Write-Ok "Scoop installed"
  Log-Action "Scoop installed"
}

function Set-Apps {
  Write-Step "Installing apps..."

  # winget — most packages
  $wingetApps = @(
    @{ Id = "Git.Git";                   Name = "Git" },
    @{ Id = "Neovim.Neovim";             Name = "Neovim" },
    @{ Id = "GitHub.cli";                Name = "GitHub CLI" },
    @{ Id = "Schniz.fnm";                Name = "fnm (Node manager)" },
    @{ Id = "junegunn.fzf";              Name = "fzf" },
    @{ Id = "sharkdp.bat";               Name = "bat" },
    @{ Id = "sharkdp.fd";                Name = "fd" },
    @{ Id = "BurntSushi.ripgrep.MSVC";   Name = "ripgrep" },
    @{ Id = "JesseDuffield.lazygit";     Name = "lazygit" },
    @{ Id = "jqlang.jq";                 Name = "jq" },
    @{ Id = "Starship.Starship";         Name = "starship" },
    @{ Id = "pnpm.pnpm";                 Name = "pnpm" },
    @{ Id = "Oven-sh.bun";               Name = "bun" },
    @{ Id = "Microsoft.WindowsTerminal"; Name = "Windows Terminal" }
  )

  foreach ($app in $wingetApps) {
    Write-Step "  winget: $($app.Name)"
    winget install --id $app.Id --accept-source-agreements --accept-package-agreements --silent 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Ok $app.Name }
    else { Write-Warn "$($app.Name) may have failed (check setup.log)"; Log-Action "Failed winget: $($app.Id)" }
  }

  # Scoop — packages not in winget or needing Unix-like behavior
  $scoopApps = @(
    @{ Name = "eza";        Desc = "modern ls" },
    @{ Name = "delta";      Desc = "git diff viewer" },
    @{ Name = "stow";       Desc = "dotfile symlink manager" },
    @{ Name = "fastfetch";  Desc = "system info" }
  )

  foreach ($app in $scoopApps) {
    Write-Step "  scoop: $($app.Name)"
    scoop install $app.Name 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Ok $app.Name }
    else { Write-Warn "$($app.Name) (scoop) may have failed"; Log-Action "Failed scoop: $($app.Name)" }
  }

  Write-Ok "App installation complete"
  Log-Action "Apps installed"
}

function Set-Node {
  Write-Step "Setting up Node LTS via fnm..."

  # Refresh PATH so fnm is available immediately
  $env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path", "User")

  if (-not (Get-Command fnm -ErrorAction SilentlyContinue)) {
    Write-Err "fnm not found — run Set-Apps first"
    return
  }

  fnm install --lts
  fnm use lts-latest
  fnm default lts-latest

  # Re-eval fnm env so node is available in this session
  fnm env --use-on-cd | Out-String | Invoke-Expression

  Write-Ok "Node $(node --version) ready"
  Log-Action "Node LTS installed"
}

function Set-DevDirs {
  Write-Step "Creating development directory structure..."
  $dirs = @(
    "$env:USERPROFILE\Development\Personal\OCI",
    "$env:USERPROFILE\Development\Office"
  )
  foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  Write-Ok "Created Development\Personal\ and Development\Office\"
}

function Set-GitConfig {
  Write-Step "Writing git config files..."

  @"
[user]
  name = Nur-e-alom Siddiky
[credential]
  helper = manager
[core]
  ignorecase = false
  excludesfile = ~/.gitignore_global
  autocrlf = false
  eol = lf
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
"@ | Set-Content "$env:USERPROFILE\.gitconfig" -Encoding UTF8

  @"
# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# editors
.idea/
*.swp
*.swo
.vscode/

# env / secrets
.env
.env.local
.env.*.local
"@ | Set-Content "$env:USERPROFILE\.gitignore_global" -Encoding UTF8

  git config --global core.excludesfile "$env:USERPROFILE\.gitignore_global"

  @"
[user]
  name = $WORK_GH_USER
  email = $WORK_EMAIL
"@ | Set-Content "$env:USERPROFILE\.gitconfig-qp" -Encoding UTF8

  @"
[user]
  name = $PERSONAL_GH_USER
  email = $PERSONAL_EMAIL
"@ | Set-Content "$env:USERPROFILE\.gitconfig-personal" -Encoding UTF8

  Write-Ok "Git config written"
  Log-Action "Git config written"
}

function Set-SSH {
  Write-Step "Setting up SSH keys..."

  $sshDir = "$env:USERPROFILE\.ssh"
  New-Item -ItemType Directory -Force -Path $sshDir | Out-Null

  $keys = @(
    @{ File = "id_ed25519_personal"; Comment = "$PERSONAL_GH_USER@windows" },
    @{ File = "id_ed25519_qp";       Comment = "$WORK_GH_USER@windows" }
  )

  foreach ($key in $keys) {
    $keyPath = Join-Path $sshDir $key.File
    if (-not (Test-Path $keyPath)) {
      ssh-keygen -t ed25519 -C $key.Comment -f $keyPath -N '""'
      Write-Ok "Generated $($key.File) — add to GitHub:"
      Get-Content "$keyPath.pub"
    } else {
      Write-Ok "SSH key $($key.File) already exists"
    }
  }

  @"
# --- WORK ACCOUNT (QP) ---
Host github.com-qp
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_qp

# --- PERSONAL ACCOUNT ---
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal

# --- OCI Remote Dev ---
Host oci
    HostName $OCI_IP
    User ubuntu
    IdentityFile $OCI_KEY
    ServerAliveInterval 60
"@ | Set-Content (Join-Path $sshDir "config") -Encoding UTF8

  Write-Ok "SSH setup complete"
  Log-Action "SSH configured"
}

function Set-PowerShellProfile {
  Write-Step "Writing PowerShell profile..."

  $profileDir = Split-Path $PROFILE
  New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

  # Back up existing profile
  if (Test-Path $PROFILE) {
    Copy-Item $PROFILE "$PROFILE.bak.$(Get-Date -UFormat %s)" -ErrorAction SilentlyContinue
  }

  @'
# ── fastfetch ────────────────────────────────────────────────────────────
if (Get-Command fastfetch -ErrorAction SilentlyContinue) { fastfetch }

# ── starship ─────────────────────────────────────────────────────────────
if (Get-Command starship -ErrorAction SilentlyContinue) {
  Invoke-Expression (&starship init powershell)
}

# ── fnm (Node version manager) ───────────────────────────────────────────
if (Get-Command fnm -ErrorAction SilentlyContinue) {
  fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
}

# ── aliases ──────────────────────────────────────────────────────────────
Set-Alias -Name v   -Value nvim
Set-Alias -Name vim -Value nvim
Set-Alias -Name lg  -Value lazygit

function ll   { eza -la --git @args }
function lt   { eza --tree --level=2 @args }
function zc   { nvim $PROFILE }
function zs   { . $PROFILE; Write-Host "Profile reloaded" }
function pi   { pnpm install @args }
function pd   { pnpm dev @args }
function pb   { pnpm build @args }
function px   { pnpm exec @args }
function nr   { npm run @args }
function nd   { npm run dev @args }
function oci-ssh { ssh oci }

# ── pnpm ─────────────────────────────────────────────────────────────────
$env:PNPM_HOME = "$env:LOCALAPPDATA\pnpm"
if ($env:PATH -notlike "*$env:PNPM_HOME*") {
  $env:PATH = "$env:PNPM_HOME;$env:PATH"
}

# ── bun ──────────────────────────────────────────────────────────────────
$env:BUN_INSTALL = "$env:USERPROFILE\.bun"
if ($env:PATH -notlike "*$env:BUN_INSTALL\bin*") {
  $env:PATH = "$env:BUN_INSTALL\bin;$env:PATH"
}

# ── fzf history search (Ctrl+R) ──────────────────────────────────────────
if (Get-Command fzf -ErrorAction SilentlyContinue) {
  Set-PSReadLineKeyHandler -Chord Ctrl+r -ScriptBlock {
    $result = (Get-Content (Get-PSReadLineOption).HistorySavePath | fzf --tac --no-sort 2>/dev/null)
    if ($result) { [Microsoft.PowerShell.PSConsoleReadLine]::Insert($result) }
  }
}

# ── history ──────────────────────────────────────────────────────────────
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadLineKeyHandler -Key UpArrow   -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
Set-PSReadLineOption -MaximumHistoryCount 10000
'@ | Set-Content $PROFILE -Encoding UTF8

  Write-Ok "PowerShell profile written to $PROFILE"
  Log-Action "PowerShell profile written"
}

function Set-WindowsDefaults {
  Write-Step "Applying Windows settings..."

  # Fast key repeat via registry
  try {
    $kbPath = "HKCU:\Control Panel\Accessibility\Keyboard Response"
    if (-not (Test-Path $kbPath)) { New-Item -Path $kbPath -Force | Out-Null }
    Set-ItemProperty -Path $kbPath -Name "AutoRepeatDelay" -Value "250"  -Type String
    Set-ItemProperty -Path $kbPath -Name "AutoRepeatRate"  -Value "30"   -Type String
    Set-ItemProperty -Path $kbPath -Name "Flags"           -Value "59"   -Type String
    Write-Ok "Keyboard repeat speed set"
  } catch {
    Write-Warn "Could not set keyboard repeat (may need elevated permissions)"
  }

  # Show file extensions in Explorer
  try {
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" `
      -Name "HideFileExt" -Value 0 -Type DWord
    Write-Ok "File extensions shown in Explorer"
  } catch {
    Write-Warn "Could not set Explorer preference"
  }

  Write-Ok "Windows defaults applied"
  Log-Action "Windows defaults applied"
}

# ── Run all ────────────────────────────────────────────────────────────────
Set-Scoop
Set-Apps
Set-Node
Set-DevDirs
Set-GitConfig
Set-SSH
Set-PowerShellProfile
Set-WindowsDefaults

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Setup complete. Restart Windows Terminal."     -ForegroundColor Cyan
Write-Host "  Then run: node --version  to verify Node."    -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
