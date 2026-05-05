vim.pack.add({
	"https://github.com/ibhagwan/fzf-lua",
	"https://github.com/nvim-tree/nvim-web-devicons",
})

require("fzf-lua").setup({ "fzf-native" })

local b = require("fzf-lua")

local map = function(lhs, rhs, desc)
	vim.keymap.set("n", lhs, rhs, { silent = true, noremap = true, desc = desc })
end

map("<leader><leader>", b.files, "Find file")
map("<leader>/", b.live_grep, "Grep in project")
map("<leader>sb", b.buffers, "Switch buffer")
map("<leader>sg", b.git_files, "Find git file")
map("<leader>sh", b.help_tags, "Search help")
map("<leader>sk", b.keymaps, "Search keymaps")
map("<leader>sd", b.diagnostics_workspace, "Search diagnostics")
map("<leader>sr", b.resume, "Resume last search")
map("<leader>s.", b.oldfiles, "Recent files")
map("<leader>sc", b.commands, "Search commands")
map("<leader>sn", function()
	b.files({ cwd = vim.fn.stdpath("config") })
end, "Search nvim config")
