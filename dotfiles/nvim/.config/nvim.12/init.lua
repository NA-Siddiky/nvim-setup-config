local config = vim.fn.stdpath("config")

for _, file in ipairs(vim.fn.globpath(config .. "/lua", "[0-9][0-9]_*.lua", false, true)) do
	local mod = vim.fn.fnamemodify(file, ":t:r")
	require(mod)
end

require("qol")
