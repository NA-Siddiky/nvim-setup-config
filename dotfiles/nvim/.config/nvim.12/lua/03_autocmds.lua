-- relative numbers off in insert mode
vim.api.nvim_create_autocmd("InsertEnter", {
	group = vim.api.nvim_create_augroup("number_insert", { clear = true }),
	callback = function()
		vim.o.relativenumber = false
	end,
})

vim.api.nvim_create_autocmd("InsertLeave", {
	group = vim.api.nvim_create_augroup("number_normal", { clear = true }),
	callback = function()
		vim.o.relativenumber = true
	end,
})

-- spell check for prose filetypes
vim.api.nvim_create_autocmd("FileType", {
	group = vim.api.nvim_create_augroup("spell_files", { clear = true }),
	pattern = { "markdown", "gitcommit", "text" },
	callback = function()
		vim.opt_local.spell = true
	end,
})

-- disable comment continuation on new lines
vim.api.nvim_create_autocmd("FileType", {
	group = vim.api.nvim_create_augroup("no_comment_continue", { clear = true }),
	callback = function()
		vim.opt_local.formatoptions:remove({ "c", "r", "o" })
	end,
})

-- open help in a right vertical split
vim.api.nvim_create_autocmd("FileType", {
	group = vim.api.nvim_create_augroup("help_right", { clear = true }),
	pattern = "help",
	command = "wincmd L",
})

-- clear cmdline message after a short delay
vim.api.nvim_create_autocmd("CmdlineLeave", {
	group = vim.api.nvim_create_augroup("clear_cmdline", { clear = true }),
	callback = function()
		vim.defer_fn(function()
			if vim.fn.mode() == "n" then
				vim.cmd("echo ''")
			end
		end, 1500)
	end,
})
