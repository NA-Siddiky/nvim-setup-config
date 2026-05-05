vim.pack.add({
	"https://github.com/neovim/nvim-lspconfig",
	"https://github.com/mason-org/mason.nvim",
	"https://github.com/mason-org/mason-lspconfig.nvim",
	"https://github.com/WhoIsSethDaniel/mason-tool-installer.nvim",
	"https://github.com/rachartier/tiny-inline-diagnostic.nvim",
})

-------------------- diagnostics --------------------
vim.diagnostic.config({
	virtual_text = false,
	update_in_insert = false,
	severity_sort = true,
	underline = true,

	signs = {
		text = {
			[vim.diagnostic.severity.ERROR] = " ",
			[vim.diagnostic.severity.WARN] = " ",
			[vim.diagnostic.severity.INFO] = " ",
			[vim.diagnostic.severity.HINT] = " ",
		},
	},

	float = {
		border = "rounded",
		source = "if_many",
		focusable = false,
	},
})

require("tiny-inline-diagnostic").setup({ preset = "ghost" })

-------------------- mason --------------------
require("mason").setup()
require("mason-lspconfig").setup()

require("mason-tool-installer").setup({
	ensure_installed = {
		-- lsp servers
		"lua_ls",
		"vtsls",
		"svelte",
		"tailwindcss",
		"html",
		"cssls",
		"gopls",
		"pyright",
		"bashls",
		"harper_ls",

		-- formatters / linters
		"prettier",
		"eslint_d",
		"oxlint",
		"oxfmt",
		"stylua",
		"gofumpt",
		"goimports",
		"black",
		"shfmt",
	},
})

-------------------- servers --------------------
-- capabilities come from blink.cmp (09_cmp runs before this)
local capabilities = require("blink.cmp").get_lsp_capabilities()

local servers = {
	lua_ls = {
		settings = {
			Lua = {
				diagnostics = { globals = { "vim" } },
				workspace = { checkThirdParty = false },
				telemetry = { enable = false },
			},
		},
	},

	vtsls = {
		settings = {
			typescript = { preferences = { importModuleSpecifier = "relative" } },
			javascript = { preferences = { importModuleSpecifier = "relative" } },
		},
	},

	svelte = {},
	tailwindcss = {},
	html = {},
	cssls = {},
	pyright = {},
	bashls = {},
	oxfmt = {},
	oxlint = {},

	gopls = {
		settings = {
			gopls = {
				gofumpt = true,
				staticcheck = true,
				usePlaceholders = true,
			},
		},
	},

	harper_ls = {
		settings = {
			["harper-ls"] = {
				userDictPath = vim.fn.stdpath("config") .. "/spell/en.utf-8.add",
				diagnosticSeverity = "hint",
				codeActions = true,
			},
		},
	},
}

for name, config in pairs(servers) do
	config.capabilities = capabilities
	vim.lsp.config(name, config)
	vim.lsp.enable(name)
end

-------------------- on attach --------------------
vim.api.nvim_create_autocmd("LspAttach", {
	group = vim.api.nvim_create_augroup("lsp_maps", { clear = true }),
	callback = function(ev)
		vim.keymap.set("n", "gd", vim.lsp.buf.definition, {
			buffer = ev.buf,
			silent = true,
			desc = "Go to definition",
		})
	end,
})
