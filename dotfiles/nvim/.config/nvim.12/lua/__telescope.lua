if true then
	return
end

vim.pack.add({
	"https://github.com/nvim-lua/plenary.nvim",
	"https://github.com/nvim-telescope/telescope.nvim",
	"https://github.com/nvim-telescope/telescope-fzf-native.nvim",
	"https://github.com/nvim-telescope/telescope-ui-select.nvim",
})

local map = function(lhs, rhs, desc)
	vim.keymap.set("n", lhs, rhs, { silent = true, noremap = true, desc = desc })
end

require("telescope").setup({
	defaults = {
		layout_strategy = "horizontal",
		sorting_strategy = "ascending",
		prompt_prefix = "   ",
		selection_caret = " ",
		file_ignore_patterns = { "node_modules", ".git/" },
		vimgrep_arguments = {
			"rg",
			"--color=never",
			"--no-heading",
			"--with-filename",
			"--line-number",
			"--column",
			"--smart-case",
			"--hidden",
			"--glob",
			"!**/.git/*",
			"--glob",
			"!**/node_modules/*",
		},
		layout_config = {
			horizontal = { prompt_position = "top", preview_width = 0.55 },
			width = 0.87,
			height = 0.80,
		},
	},
	path_display = { "truncate" },
	extensions = {
		["ui-select"] = require("telescope.themes").get_dropdown(),
		fzf = { fuzzy = true, override_generic_sorter = true, override_file_sorter = true, case_mode = "smart_case" },
	},
	pickers = {
		find_files = { hidden = true, no_ignore = false },
		oldfiles = { cwd_only = true },
	},
	preview = { filesize_limit = 0.1, timeout = 250, treesitter = false },
	mappings = {
		n = { ["q"] = require("telescope.actions").close },
		i = { ["<C-u>"] = false, ["<C-d>"] = false },
	},
})

pcall(require("telescope").load_extension, "ui-select")

if not pcall(require("telescope").load_extension, "fzf") then
	vim.notify("telescope-fzf-native not compiled — cd into plugin dir and run `make`", vim.log.levels.WARN)
end

local b = require("telescope.builtin")

map("<leader><leader>", b.find_files, "Find file")
map("<leader>/", b.live_grep, "Grep in project")
map("<leader>sb", b.buffers, "Switch buffer")
map("<leader>sg", b.git_files, "Find git file")
map("<leader>sh", b.help_tags, "Search help")
map("<leader>sk", b.keymaps, "Search keymaps")
map("<leader>sd", b.diagnostics, "Search diagnostics")
map("<leader>sr", b.resume, "Resume last search")
map("<leader>s.", b.oldfiles, "Recent files")
map("<leader>sc", b.commands, "Search commands")
map("<leader>sn", function()
	b.find_files({ cwd = vim.fn.stdpath("config") })
end, "Search nvim config")
