vim.pack.add({
	"https://github.com/sainnhe/gruvbox-material",
	"https://github.com/sainnhe/everforest",
	"https://github.com/folke/tokyonight.nvim",
	"https://github.com/rebelot/kanagawa.nvim",
})

vim.g.gruvbox_material_enable_italic = 1
vim.g.gruvbox_material_better_performance = 1
vim.g.gruvbox_material_background = "hard"
vim.g.gruvbox_material_transparent_background = 2

vim.g.everforest_enable_italic = 1
vim.g.everforest_better_performance = 1
vim.g.everforest_background = "hard"
vim.g.everforest_transparent_background = 2

require("tokyonight").setup({
	transparent = true,
	styles = {
		functions = { italic = true },
		keywords = { italic = true },
		comments = { italic = true },
		variables = { italic = true },
	},
})

require("kanagawa").setup({
	theme = "dragon",
	undercurl = true,
	commentStyle = { italic = true },
	functionStyle = { italic = true },
	keywordStyle = { italic = true },
	statementStyle = { italic = true },
	typeStyle = { italic = true },
	variablebuiltinStyle = { italic = true },
	specialReturn = true,
	specialException = true,
	blend = true,
	disableItalicComment = true,
	colors = {
		theme = { all = { ui = { bg_gutter = "none" } } },
	},
})

vim.cmd.colorscheme("gruvbox-material")
