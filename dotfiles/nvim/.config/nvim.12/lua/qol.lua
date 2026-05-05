vim.pack.add({
	"https://github.com/folke/flash.nvim",
	"https://github.com/sphamba/smear-cursor.nvim",
	"https://github.com/wakatime/vim-wakatime",
	"https://github.com/brianhuster/live-preview.nvim",
	"https://github.com/folke/todo-comments.nvim",
	"https://github.com/MeanderingProgrammer/render-markdown.nvim",
})

require("flash").setup()

require("smear_cursor").setup({
	cursor_color                       = "auto",
	stiffness                          = 0.55,
	trailing_stiffness                 = 0.25,
	stiffness_insert_mode              = 0.55,
	trailing_stiffness_insert_mode     = 0.25,
	damping                            = 0.82,
	damping_insert_mode                = 0.82,
	distance_stop_animating            = 0.5,
	time_interval                      = 7,
	hide_target_hack                   = true,
	legacy_computing_symbols_support   = false,
})

require("todo-comments").setup({})
require("render-markdown").setup({})
