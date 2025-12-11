# fastfetch
# Add deno completions to search path
# if [[ ":$FPATH:" != *":/home/mahi/.zsh/completions:"* ]]; then export FPATH="/home/mahi/.zsh/completions:$FPATH"; fi
export ZSH="$HOME/.oh-my-zsh"

# Plugins
DISABLE_UNTRACKED_FILES_DIRTY="true"
plugins=(git z zsh-autosuggestions zsh-syntax-highlighting)
# fpath+=${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src
source $ZSH/oh-my-zsh.sh

# aliases
# alias vi="~/Documents/Coding/Projects/shikorux/scripts/vi.sh"
alias v="NVIM_APPNAME=nvim-pure nvim"
alias vi="nvim"

alias zc="vi ~/.zshrc"
alias zs="source ~/.zshrc"
alias ls="eza"
alias ll="eza -la"

alias setup="vi ~/projects/nvim-setup-config/"
alias note="~/Documents/Coding/Projects/setthemacup/scripts/note.sh"
alias wick="~/Documents/Coding/Projects/setthemacup/scripts/wick.sh"
alias dev="~/projects/nvim-setup-config/scripts/dev.sh"

# starship
eval "$(starship init zsh)"

# fzf search
# source <(fzf --zsh)

# history
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory
setopt sharehistory
setopt incappendhistory
setopt extendedhistory
setopt histignorealldups
setopt histignorespace
setopt histignoredups
setopt histreduceblanks

# Initialize zsh completions (added by deno install script)
# autoload -Uz compinit
# compinit
# eval "$(fnm env --use-on-cd --shell zsh)"

# pnpm
export PNPM_HOME="/Users/mahi/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
# pnpm end

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# opencode
export PATH=/home/ubuntu/.opencode/bin:$PATH
