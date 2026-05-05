vim.pack.add({ "https://github.com/stevearc/quicker.nvim" })

require("quicker").setup({})

vim.keymap.set("n", "<leader>xx", function()
	require("quicker").toggle({ focus = true })
end, { silent = true, desc = "Toggle quickfix" })

vim.keymap.set("n", "<leader>xl", function()
	require("quicker").toggle({ loclist = true, focus = true })
end, { silent = true, desc = "Toggle loclist" })

vim.keymap.set("n", "]q", "<cmd>cnext<CR>", { silent = true, desc = "Next quickfix" })
vim.keymap.set("n", "[q", "<cmd>cprev<CR>", { silent = true, desc = "Prev quickfix" })
vim.keymap.set("n", "]Q", "<cmd>clast<CR>", { silent = true, desc = "Last quickfix" })
vim.keymap.set("n", "[Q", "<cmd>cfirst<CR>", { silent = true, desc = "First quickfix" })

vim.keymap.set("n", "]l", "<cmd>lnext<CR>", { silent = true, desc = "Next loclist" })
vim.keymap.set("n", "[l", "<cmd>lprev<CR>", { silent = true, desc = "Prev loclist" })
