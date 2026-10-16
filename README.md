# claude-kit


| Plugin | What it does |
| --- | --- |
| `ckopen` | `/ckopen` opens the current directory in VS Code. Needs `code` on your `PATH`. |
| `ckupdate` | `/ckupdate` syncs your claude-kit plugins with this repo: installs new ones, removes old ones, updates the rest, reloads. |
| `ckbrainstorm` | "Let's brainstorm X" or "come up with ideas for X": strips the goal down to first principles, invents three ordinary people who meet that core, drafts ten idea titles through their eyes, makes the titles bolder and more different, then expands the five that differ most. |
| `ckgrill` | "Grill me" on a plan, design, or idea: maps its decisions as a tree, asks every question that is ready in numbered rounds with a recommended answer for each, looks facts up itself, and stops when nothing is left assumed. Adapted from Matt Pocock's [grill-me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling) (MIT). |

## Install

```
/plugin install ckopen --marketplace pooryam92/claude-kit
/plugin install ckupdate --marketplace pooryam92/claude-kit
/plugin install ckbrainstorm --marketplace pooryam92/claude-kit
/plugin install ckgrill --marketplace pooryam92/claude-kit
```

## Update

```
/ckupdate
```
