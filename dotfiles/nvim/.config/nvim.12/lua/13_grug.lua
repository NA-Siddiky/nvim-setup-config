vim.pack.add({ "https://github.com/MagicDuck/grug-far.nvim" })

require("grug-far").setup({})

vim.keymap.set("n", "<leader>r", function()
	require("grug-far").open()
end, { desc = "Find & replace" })
