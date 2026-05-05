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
	cursor_color = "auto",
	stiffness = 0.8,
	trailing_stiffness = 0.55,
	stiffness_insert_mode = 0.8,
	trailing_stiffness_insert_mode = 0.55,
	damping = 0.88,
	damping_insert_mode = 0.88,
	distance_stop_animating = 1.5,
	time_interval = 7,
	hide_target_hack = true,
})

require("todo-comments").setup({})
require("render-markdown").setup({})

vim.keymap.set("n", "<leader>lo", "<cmd>LivePreview start<CR>", { silent = true, desc = "Open live preview" })
vim.keymap.set("n", "<leader>lc", "<cmd>LivePreview close<CR>", { silent = true, desc = "Close live preview" })
