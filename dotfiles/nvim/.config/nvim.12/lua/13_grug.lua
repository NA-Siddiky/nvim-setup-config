vim.pack.add({ "https://github.com/MagicDuck/grug-far.nvim" })

require("grug-far").setup({})

vim.keymap.set("n", "<leader>rr", function()
	require("grug-far").open()
end, { desc = "Grug Far" })
