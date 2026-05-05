vim.pack.add({
	"https://github.com/nvim-treesitter/nvim-treesitter",
	"https://github.com/windwp/nvim-ts-autotag",
})

local parsers = {
	"bash", "css", "dockerfile", "go", "html", "javascript", "jsdoc",
	"json", "lua", "markdown", "markdown_inline", "python", "regex",
	"sql", "svelte", "toml", "tsx", "typescript", "vim", "yaml",
}

require("nvim-treesitter").install(parsers)

vim.api.nvim_create_autocmd("FileType", {
	group   = vim.api.nvim_create_augroup("ts_highlight", { clear = true }),
	pattern = parsers,
	callback = function() pcall(vim.treesitter.start) end,
})

require("nvim-ts-autotag").setup()
