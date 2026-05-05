vim.pack.add({
	"https://github.com/stevearc/conform.nvim",
	"https://github.com/mfussenegger/nvim-lint",
})

local conform = require("conform")

conform.setup({
	formatters_by_ft = {
		javascript      = { "prettier" },
		typescript      = { "prettier" },
		javascriptreact = { "prettier" },
		typescriptreact = { "prettier" },
		svelte          = { "prettier" },
		css             = { "prettier" },
		html            = { "prettier" },
		json            = { "prettier" },
		yaml            = { "prettier" },
		markdown        = { "prettier" },
		graphql         = { "prettier" },
		liquid          = { "prettier" },
		lua             = { "stylua" },
		python          = { "isort", "black" },
		go              = { "goimports", "gofumpt" },
	},
	format_on_save = { lsp_fallback = true, async = false, timeout_ms = 3000 },
})

vim.api.nvim_create_autocmd({ "BufReadPost", "BufWritePost" }, {
	callback = function(args)
		conform.format({ bufnr = args.buf, timeout_ms = 1500, lsp_fallback = false })
	end,
})

local lint = require("lint")

lint.linters_by_ft = {
	python          = { "pylint" },
	typescript      = { "eslint_d" },
	javascript      = { "eslint_d" },
	svelte          = { "eslint_d" },
	typescriptreact = { "eslint_d" },
	javascriptreact = { "eslint_d" },
	css             = { "stylelint" },
}

vim.api.nvim_create_autocmd({ "BufEnter", "BufWritePost", "InsertLeave" }, {
	group    = vim.api.nvim_create_augroup("lint", { clear = true }),
	callback = function()
		lint.try_lint(lint.linters_by_ft[vim.bo.filetype])
	end,
})
