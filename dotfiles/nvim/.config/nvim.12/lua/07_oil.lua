vim.pack.add({ "https://github.com/stevearc/oil.nvim" })

require("oil").setup({
	default_file_explorer = true,
	delete_to_trash = true,
	skip_confirm_for_simple_edits = true,
	view_options = {
		show_hidden = true,
	},
})

vim.keymap.set("n", "-", "<cmd>Oil<CR>", { silent = true, noremap = true, desc = "Open parent dir" })
