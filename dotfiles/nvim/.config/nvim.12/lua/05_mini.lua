vim.pack.add({ "https://github.com/echasnovski/mini.nvim" })

-- text objects with treesitter awareness
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

-- sane defaults (better defaults for common options)
require("mini.basics").setup()

-- gc to toggle comments (treesitter-aware)
require("mini.comment").setup()

-- highlight word under cursor
require("mini.cursorword").setup()

-- diff signs in the gutter
require("mini.diff").setup({
	view = { style = "sign" },
})

-- icons + nvim-web-devicons compat shim
require("mini.icons").setup()
require("mini.icons").mock_nvim_web_devicons()

-- indent scope indicator
require("mini.indentscope").setup()

-- move lines/selections with Alt+hjkl
require("mini.move").setup()

-- replace vim.notify with styled floating notifications
require("mini.notify").setup()
vim.notify = require("mini.notify").make_notify()

-- auto-pair brackets/quotes
require("mini.pairs").setup()

-- snippets engine (used by blink.cmp)
require("mini.snippets").setup({
	snippets = {
		require("mini.snippets").gen_loader.from_lang(),
	},
})

-- gS to split/join function args and arrays
require("mini.splitjoin").setup()

-- statusline
require("mini.statusline").setup()

-- sa/sd/sr — add, delete, replace surrounds
require("mini.surround").setup()

-- tabline
require("mini.tabline").setup()

-- highlight trailing whitespace
require("mini.trailspace").setup()

-- which-key replacement: shows pending keymap popup
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
		{ mode = "n", keys = "<leader>f", desc = "+find" },
		{ mode = "n", keys = "<leader>q", desc = "+quit" },
	},
})
