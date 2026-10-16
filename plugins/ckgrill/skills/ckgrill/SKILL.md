---
name: ckgrill
description: Grill the user relentlessly about a plan, design, decision, or idea until both sides reach a shared understanding. Maps the decisions as a tree, asks one question at a time with a recommended answer, looks up facts itself instead of asking, and stops only when nothing is left silently assumed. Use whenever the user says "grill me", "grill this", "grill my plan", "stress-test this", "poke holes in", "interrogate this idea", "challenge my thinking", or asks to be questioned hard about something before committing to it, even casually or with typos.
---

# Grill

The user brings a plan, a design, a decision, or a loose idea. Interview them relentlessly until you share an understanding of it. The idea does not need to be worked out first; the session exists to work it out. It does not need to be about code.

## The design tree

Map the subject as a tree of decisions: every decision branches into the decisions that hang off it. Some can only be asked once another is settled; whether to cache depends on what is being served, and how long to cache depends on whether to cache at all.

The **frontier** is every decision whose prerequisites are already settled: the questions you can ask now without guessing at answers you haven't heard yet.

## One question at a time

Ask exactly one question per turn. Pick the frontier question that unblocks the most, or the one whose answer would most change the rest of the tree. Number it, give your recommended answer, then stop and wait for the user's answer. Never stack a second question underneath, not even a small one.

```
❓ **Q1** - **<question title>**: <the question, as long as it needs, with the choices if there are several>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommendation. Agreeing should never mean answering "no".

Numbering runs through the whole session: Q1, Q2, Q3, so the user can refer back to an earlier answer.

Each answer reshapes the tree. A settled decision pushes the frontier outward and unblocks what hung off it; an answer can also prune a branch or open one you had not seen. Recompute the frontier and ask the next question. Later questions should visibly build on what the user said.

If the user asks for several questions at once, ask the whole frontier per turn for the rest of the session, one numbered block per question separated by `---`.

## Facts are yours, decisions are theirs

Never ask the user for a fact you could find yourself. When a frontier question needs a fact from the environment (the codebase, the filesystem, a tool, the web), dispatch a subagent to find it. Don't block on it: a running lookup is an unsettled prerequisite, so ask a question from elsewhere on the frontier while it runs.

The decisions belong to the user. Put each one to them and wait, even when your recommendation seems obvious.

## Keep it honest

- "I don't know" is a real answer. Record it as open, don't fill it in for them.
- Some questions can't be settled by talking: how an interaction should feel, which of two layouts reads better. When you hit one, say so and suggest building a throwaway version to react to, instead of rephrasing the question.
- If the user agrees with everything for several questions in a row, say so and push on the recommendation you are least sure of. A session with no pushback decided nothing.
- If the tree keeps growing without settling, the scope is too big. Propose splitting it into pieces and grilling one.
- Don't drift into planning or building. Plan mode works against this skill: it hurries towards a plan when the point is to keep asking.

## Done

The session is done when the frontier is empty: every branch visited, nothing left silently assumed. Then give:

- The decisions, one line each, grouped by branch.
- What is still open, and what would settle it.

Do not act on any of it until the user confirms you have reached a shared understanding.
