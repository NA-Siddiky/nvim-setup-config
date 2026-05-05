# Neovim Cheatsheet

## Windows & Buffers

Split the screen with `<leader>|` (vertical) or `<leader>-` (horizontal), then
move between windows using `<C-h/j/k/l>`. Cycle buffers forward and back with
`<S-l>` and `<S-h>`, or jump straight to the last visited one with `<S-j>`.
Close the current buffer with `<leader>bd`, or wipe all others with `<leader>bo`.
Quit everything at once with `<leader>qq`.

## Navigation

`<C-d>` and `<C-u>` scroll half a page and keep the cursor centered. `n` and `N`
jump between search matches, also centered. Press `-` anywhere to open the
parent directory in oil.nvim — edit it like a buffer, save to apply changes.
`<leader>tu` opens the undo tree so you can travel through history visually.

## Search — mini.pick

`<leader><leader>` finds any file (including hidden ones). `<leader>/` launches
a live grep across the project. `<leader>sb` switches between open buffers,
`<leader>sg` searches only git-tracked files, `<leader>s.` shows recent files.
Use `<leader>sh` for help tags, `<leader>sk` for keymaps, `<leader>sd` for
diagnostics, `<leader>sc` for commands. `<leader>sn` scopes the search to your
nvim config. `<leader>sr` resumes the last picker. Press `<Tab>` inside any
picker to toggle a file preview.

## LSP

`K` shows hover docs — or, in any non-LSP buffer, it runs `:help!` which is the new
nvim 0.12 DWIM help: it looks at the word under the cursor, strips punctuation, and
opens the closest matching help tag automatically. Great for exploring Lua APIs inline. Rename a symbol with `grn`, trigger a code action with
`gra`, list references with `grr`, jump to implementation with `gri`, and go to
the type definition with `grt`, and run codelens with `grx`. `gO` shows the
document symbol outline. Navigate diagnostics with `]d` / `[d`, or open the
diagnostic float with `<C-W>d`.
In CSS/HTML/Svelte files, LSP color values get a colored `■` swatch inline.
Linked editing keeps paired tags in sync when the server supports it. Harper
grammar hints appear as diagnostics — use `gra` to add a word to your personal
dictionary via code action.

## Git — mini.git

`<leader>gh` shows the git context for the symbol under the cursor. `<leader>gb`
opens a vertical blame for the current file, and `<leader>gl` shows the file's
commit log. Diff hunks are shown in the sign column automatically via mini.diff.

## Editing

Comment lines or motions with `gc` / `gcc` (built-in). Surround text with `sa`
(add), `sd` (delete), `sr` (replace) — e.g. `saiw"` wraps a word in quotes.
Yank to the system clipboard with `<leader>y`, paste with `<leader>p` or
`<leader>P`. Find and replace project-wide with `<leader>rr` (grug-far).

## Text Objects — mini.ai

These extend `v`, `d`, `c`, `y` with smarter targets. `f` is a function,
`c` is a class, `o` is a conditional, `l` is a loop, `a` is an argument,
`b` is a block, `C` is a comment. So `daf` deletes a whole function, `cil`
changes inside a loop, `vac` selects a whole class including its header.

## Completion

The completion menu appears automatically. `<C-y>` confirms the selected item.
`<Tab>` accepts the supermaven AI ghost text suggestion when the menu is closed.
Signatures show inline as you type. Snippets come from friendly-snippets and
expand through blink.cmp.

## Quickfix & Loclist

Toggle the quickfix with `<leader>xx` and the loclist with `<leader>xl`. Step
through items with `]q` / `[q`, jump to the ends with `]Q` / `[Q`. For the
loclist use `]l` / `[l`. Linting results land here automatically on save.

## Misc

`<leader>tm` toggles the minimap, `<leader>tu` the undo tree, and `<leader>ti`
inlay hints. `<leader>du` opens the database UI.
`<leader>lo` / `<leader>lc` starts and stops the live HTML preview.
`<leader>r` opens find & replace (grug-far). Press `<Esc>` to clear search
highlights. `jj` exits insert mode. Open this file anytime with `<leader>?`.
