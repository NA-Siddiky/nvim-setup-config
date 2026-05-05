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
		fzf = {
			fuzzy = true,
			override_generic_sorter = true,
			override_file_sorter = true,
			case_mode = "smart_case",
		},
	},

	pickers = {
		find_files = { hidden = true, no_ignore = false },
		oldfiles = { cwd_only = true },
	},

	preview = {
		filesize_limit = 0.1,
		timeout = 250,
		treesitter = false,
	},

	mappings = {
		n = { ["q"] = require("telescope.actions").close },
		i = {
			["<C-u>"] = false,
			["<C-d>"] = false,
		},
	},
})

pcall(require("telescope").load_extension, "ui-select")

local fzf_ok = pcall(require("telescope").load_extension, "fzf")
if not fzf_ok then
	vim.notify(
		"Telescope FZF not compiled — run 'make' inside the plugin folder.\n"
			.. "cd ~/.local/share/nvim.12/site/pack/core/opt/telescope-fzf-native.nvim && make",
		vim.log.levels.WARN
	)
end

local builtin = require("telescope.builtin")

map("<leader><leader>", builtin.find_files, "Files")
map("<leader>/", builtin.live_grep, "Grep")
map("<leader>sb", builtin.buffers, "Buffers")
map("<leader>sg", builtin.git_files, "Git files")
map("<leader>sh", builtin.help_tags, "Help")
map("<leader>sk", builtin.keymaps, "Keymaps")
map("<leader>sd", builtin.diagnostics, "Diagnostics")
map("<leader>sr", builtin.resume, "Resume")
map("<leader>s.", builtin.oldfiles, "Recent files")
map("<leader>sc", builtin.commands, "Commands")
map("<leader>sn", function()
	builtin.find_files({ cwd = vim.fn.stdpath("config") })
end, "Search nvim config")
