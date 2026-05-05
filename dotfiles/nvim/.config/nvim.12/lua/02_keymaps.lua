local map = vim.keymap.set
local function o(desc)
	return { silent = true, noremap = true, desc = desc }
end

map("i", "jj", "<Esc>", { silent = true, desc = "Exit insert" })

map("n", "<Esc>", "<cmd>nohlsearch<CR>", o("Clear search highlight"))
map("n", "<leader>qq", "<cmd>qa<CR>", o("Quit all"))

map("n", "<C-h>", "<C-w>h", o("Focus left"))
map("n", "<C-j>", "<C-w>j", o("Focus down"))
map("n", "<C-k>", "<C-w>k", o("Focus up"))
map("n", "<C-l>", "<C-w>l", o("Focus right"))

map("n", "<S-h>", "<cmd>bprevious<CR>", o("Prev buffer"))
map("n", "<S-l>", "<cmd>bnext<CR>", o("Next buffer"))
map("n", "<S-j>", "<cmd>b#<CR>", o("Last buffer"))

map({ "n", "v" }, "<leader>y", '"+y', o("Yank to clipboard"))
map({ "n", "v" }, "<leader>p", '"+p', o("Paste from clipboard"))
map({ "n", "v" }, "<leader>P", '"+P', o("Paste from clipboard (before)"))

map("n", "<leader>bo", function()
	local cur = vim.fn.bufnr()
	for _, buf in ipairs(vim.fn.getbufinfo({ buflisted = 1 })) do
		if buf.bufnr ~= cur then
			vim.api.nvim_buf_delete(buf.bufnr, { force = false })
		end
	end
end, o("Close other buffers"))
