require("mini.pick").setup({
	window = {
		prompt_prefix = "   ",
		prompt_caret  = "│",
	},
	source = {
		show = function(buf_id, items, query)
			MiniPick.default_show(buf_id, items, query, { show_icons = true })
		end,
	},
})

-- ── Transparent highlights, inheriting fg from the active theme ────────────────
local function pick_hl()
	local function fg(group)
		local ok, hl = pcall(vim.api.nvim_get_hl, 0, { name = group, link = false })
		return (ok and hl.fg) and hl.fg or nil
	end
	local set = function(group, opts) vim.api.nvim_set_hl(0, group, opts) end
	set("MiniPickNormal",       { fg = fg("NormalFloat"),            bg = "NONE" })
	set("MiniPickBorder",       { fg = fg("FloatBorder"),            bg = "NONE" })
	set("MiniPickBorderBusy",   { fg = fg("DiagnosticFloatingWarn"), bg = "NONE" })
	set("MiniPickBorderText",   { fg = fg("FloatTitle"),             bg = "NONE" })
	set("MiniPickHeader",       { fg = fg("DiagnosticFloatingHint"), bg = "NONE" })
	set("MiniPickPrompt",       { fg = fg("DiagnosticFloatingInfo"), bg = "NONE" })
	set("MiniPickPromptCaret",  { fg = fg("DiagnosticFloatingInfo"), bg = "NONE" })
	set("MiniPickPromptPrefix", { fg = fg("DiagnosticFloatingInfo"), bg = "NONE" })
end

vim.api.nvim_create_autocmd("ColorScheme", {
	group = vim.api.nvim_create_augroup("MiniPickTheme", { clear = true }),
	callback = pick_hl,
})
pick_hl()

-- ── Disable smear-cursor while picker is open ─────────────────────────────────
local grp = vim.api.nvim_create_augroup("MiniPickExtras", { clear = true })
vim.api.nvim_create_autocmd("User", {
	pattern = "MiniPickStart", group = grp,
	callback = function() require("smear_cursor").enabled = false end,
})
vim.api.nvim_create_autocmd("User", {
	pattern = "MiniPickStop", group = grp,
	callback = function() require("smear_cursor").enabled = true end,
})

-- ── Files picker (includes hidden files) ──────────────────────────────────────
local function pick_files(opts)
	if vim.fn.executable("fd") == 1 then
		return MiniPick.builtin.cli(
			{ command = { "fd", "--type=f", "--hidden", "--exclude=.git", "--color=never" } },
			opts
		)
	elseif vim.fn.executable("rg") == 1 then
		return MiniPick.builtin.cli(
			{ command = { "rg", "--files", "--hidden", "--glob=!.git", "--color=never" } },
			opts
		)
	else
		return MiniPick.builtin.files(nil, opts)
	end
end

-- ── Keymaps ───────────────────────────────────────────────────────────────────
local b = MiniPick.builtin
local e = MiniExtra.pickers

local map = function(lhs, rhs, desc)
	vim.keymap.set("n", lhs, rhs, { silent = true, noremap = true, desc = desc })
end

map("<leader><leader>", pick_files,   "Find file")
map("<leader>/",        b.grep_live,  "Grep in project")
map("<leader>sb",       b.buffers,    "Switch buffer")
map("<leader>sg",       e.git_files,  "Find git file")
map("<leader>sh",       b.help,       "Search help")
map("<leader>sk",       e.keymaps,    "Search keymaps")
map("<leader>sd",       e.diagnostic, "Search diagnostics")
map("<leader>sr",       b.resume,     "Resume last search")
map("<leader>s.",       e.oldfiles,   "Recent files")
map("<leader>sc",       e.commands,   "Search commands")
map("<leader>sn", function()
	pick_files({ source = { cwd = vim.fn.stdpath("config") } })
end, "Search nvim config")
