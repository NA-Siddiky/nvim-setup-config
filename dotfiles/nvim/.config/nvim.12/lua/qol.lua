vim.pack.add({
	"https://github.com/max397574/better-escape.nvim",
	"https://github.com/folke/flash.nvim",
	"https://github.com/sphamba/smear-cursor.nvim",
	"https://github.com/wakatime/vim-wakatime",
	"https://github.com/brianhuster/live-preview.nvim",
	"https://github.com/folke/todo-comments.nvim",
	"https://github.com/MeanderingProgrammer/render-markdown.nvim",
})

-- jk/jj to escape insert mode without delay
require("better_escape").setup({})

-- f/t/F/T motions + search jump enhancement
require("flash").setup()

-- smooth animated cursor trail
-- fixes: original config incorrectly nested all opts under `opts = {}`
require("smear_cursor").setup({
	cursor_color = "auto",         -- inherit terminal cursor colour
	stiffness = 0.55,              -- lower = more fluid
	trailing_stiffness = 0.25,     -- slow trailing blob for smoothness
	stiffness_insert_mode = 0.55,
	trailing_stiffness_insert_mode = 0.25,
	damping = 0.82,                -- slight elasticity on arrival
	damping_insert_mode = 0.82,
	distance_stop_animating = 0.5,
	time_interval = 7,             -- ~144fps feel
	hide_target_hack = true,       -- cleaner target cell
	legacy_computing_symbols_support = false,
})

-- highlight TODO/FIXME/HACK/NOTE comments
require("todo-comments").setup({})

-- render markdown with concealed syntax
require("render-markdown").setup({})
