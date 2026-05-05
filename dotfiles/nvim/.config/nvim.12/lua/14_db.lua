vim.pack.add({
	"https://github.com/tpope/vim-dadbod",
	"https://github.com/kristijanhusak/vim-dadbod-ui",
	"https://github.com/kristijanhusak/vim-dadbod-completion",
})

vim.g.db_ui_save_location = vim.fn.stdpath("data") .. "/db_ui"
vim.keymap.set("n", "<leader>du", "<cmd>DBUIToggle<CR>", { desc = "Toggle DB UI" })
