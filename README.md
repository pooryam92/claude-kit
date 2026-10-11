# claude-kit


| Plugin | What it does |
| --- | --- |
| `ckopen` | `/ckopen` opens the current directory in VS Code. Needs `code` on your `PATH`. |
| `ckupdate` | `/ckupdate` syncs your claude-kit plugins with this repo: installs new ones, removes old ones, updates the rest, reloads. |
| `brainstorm` | "Let's brainstorm X" or "come up with ideas for X": generates k candidates with probabilities and samples from the tails, so you get the unusual ideas instead of the obvious ones. |

## Install

```
/plugin install ckopen --marketplace pooryam92/claude-kit
/plugin install ckupdate --marketplace pooryam92/claude-kit
/plugin install brainstorm --marketplace pooryam92/claude-kit
```

## Update

```
/ckupdate
```
