vim.pack.add({ "https://github.com/echasnovski/mini.nvim" })

require("mini.extra").setup()

require("mini.ai").setup({
	custom_textobjects = {
		f = require("mini.ai").gen_spec.treesitter({ a = "@function.outer", i = "@function.inner" }),
		c = require("mini.ai").gen_spec.treesitter({ a = "@class.outer", i = "@class.inner" }),
		o = require("mini.ai").gen_spec.treesitter({ a = "@conditional.outer", i = "@conditional.inner" }),
		l = require("mini.ai").gen_spec.treesitter({ a = "@loop.outer", i = "@loop.inner" }),
		a = require("mini.ai").gen_spec.treesitter({ a = "@parameter.outer", i = "@parameter.inner" }),
		b = require("mini.ai").gen_spec.treesitter({ a = "@block.outer", i = "@block.inner" }),
		C = require("mini.ai").gen_spec.treesitter({ a = "@comment.outer", i = "@comment.inner" }),
	},
})

require("mini.basics").setup()
require("mini.comment").setup()
require("mini.cursorword").setup()
require("mini.cmdline").setup()
require("mini.diff").setup({ view = { style = "sign" } })
require("mini.git").setup()
require("mini.icons").setup()
require("mini.icons").mock_nvim_web_devicons()
require("mini.indentscope").setup()
require("mini.move").setup()

require("mini.notify").setup()
vim.notify = require("mini.notify").make_notify()

require("mini.pairs").setup()
require("mini.snippets").setup({ snippets = { require("mini.snippets").gen_loader.from_lang() } })
require("mini.splitjoin").setup()
require("mini.statusline").setup()
require("mini.surround").setup()
require("mini.tabline").setup()
require("mini.trailspace").setup()

local minimap = require("mini.map")
minimap.setup({
	integrations = {
		minimap.gen_integration.builtin_search(),
		minimap.gen_integration.diagnostic(),
		minimap.gen_integration.diff(),
	},
})
vim.keymap.set("n", "<leader>mm", MiniMap.toggle, { silent = true, desc = "Toggle minimap" })

vim.keymap.set({ "n", "x" }, "<leader>gh", function()
	MiniGit.show_at_cursor()
end, { desc = "Show git history" })
vim.keymap.set("n", "<leader>gb", "<cmd>vertical Git blame -- %<CR>", { desc = "Show git blame" })
vim.keymap.set("n", "<leader>gl", "<cmd>Git log --oneline -- %<CR>", { desc = "Show file git log" })

local clue = require("mini.clue")
clue.setup({
	triggers = {
		{ mode = "n", keys = "<leader>" },
		{ mode = "x", keys = "<leader>" },
		{ mode = "n", keys = "g" },
		{ mode = "x", keys = "g" },
		{ mode = "n", keys = "z" },
		{ mode = "n", keys = "[" },
		{ mode = "n", keys = "]" },
		{ mode = "n", keys = '"' },
		{ mode = "n", keys = "'" },
		{ mode = "i", keys = "<C-x>" },
	},
	clues = {
		clue.gen_clues.builtin_completion(),
		clue.gen_clues.g(),
		clue.gen_clues.marks(),
		clue.gen_clues.registers(),
		clue.gen_clues.windows(),
		clue.gen_clues.z(),
		{ mode = "n", keys = "<leader>b", desc = "+buffer" },
		{ mode = "n", keys = "<leader>f", desc = "+find" },
		{ mode = "n", keys = "<leader>g", desc = "+git" },
		{ mode = "n", keys = "<leader>h", desc = "+harper" },
		{ mode = "n", keys = "<leader>l", desc = "+live-preview" },
		{ mode = "n", keys = "<leader>m", desc = "+map" },
		{ mode = "n", keys = "<leader>q", desc = "+quit" },
		{ mode = "n", keys = "<leader>s", desc = "+search" },
		{ mode = "n", keys = "<leader>x", desc = "+quickfix" },
	},
})
