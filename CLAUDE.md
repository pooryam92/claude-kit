# Working in claude-kit

**Bump the version on every change to a plugin.** Any edit under `plugins/<name>/` raises
`version` in that plugin's `.claude-plugin/plugin.json` in the same commit. `/ckupdate` runs
`claude plugin update`, which compares version numbers: a changed plugin that keeps its
version stays on the old cached copy.
