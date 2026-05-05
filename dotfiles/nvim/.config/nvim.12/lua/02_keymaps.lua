local map = vim.keymap.set
local function opts(desc)
	return { silent = true, noremap = true, desc = desc }
end

map("n", "<Esc>", "<cmd>nohlsearch<CR>", opts("Clear search"))
map("n", "<leader>qq", "<cmd>qa<CR>", opts("Quit all"))

map("n", "<C-h>", "<C-w>h", opts("Left window"))
map("n", "<C-j>", "<C-w>j", opts("Down window"))
map("n", "<C-k>", "<C-w>k", opts("Up window"))
map("n", "<C-l>", "<C-w>l", opts("Right window"))

map("n", "<S-h>", "<cmd>bprevious<CR>", opts("Prev buffer"))
map("n", "<S-l>", "<cmd>bnext<CR>", opts("Next buffer"))
map("n", "<S-j>", "<cmd>b#<CR>", opts("Last buffer"))

map({ "n", "v" }, "<leader>y", '"+y', opts("Yank to clipboard"))
