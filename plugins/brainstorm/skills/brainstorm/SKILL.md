---
name: brainstorm
description: Brainstorm and generate ideas for whatever the user describes, sampling unusual candidates instead of the obvious ones. Use whenever the user says "let's brainstorm", "come up with ideas for", "give me ideas", "what are some ways to", "options for", "alternatives to", "names for", "angles on", "how else could we", or asks for suggestions, variations, concepts, approaches, titles, taglines, features, hooks, or hypotheses, even casually or with typos. Also use when they say earlier ideas were obvious, generic, or samey and want fresh ones.
---

# Brainstorm

The user describes a topic, problem, or thing. Run this prompt on it in your thinking (or a scratch pass if you have no thinking), then answer from the result.

Defaults: k = 10 (5 for ideas that need a paragraph each, 20 for one-liners such as names), threshold = 0.10 (lower for wilder ideas, 0.05 or above when few answers are valid, never below 0.01).

```
Generate {k} responses to the input prompt using chain-of-thought reasoning.

First, provide a single "reasoning" field as a string, detailing your step-by-step thought process.
Then, return the output in JSON format with the key "responses" (list of dicts). Each dictionary must include:
- text: the response string only (no explanation or extra text).
- probability: the estimated probability from 0.0 to 1.0 of this response given the input prompt (relative to the full distribution).

Randomly sample the responses from the distribution, with the probability of each response below {threshold}.
Return ONLY the JSON object, with no additional explanations or text.
```

Input prompt = the user's description, plus any constraints they gave (audience, budget, tone, length, must-haves).

Answer:

- List the k ideas, one line each, with a short hook saying why it could work. Order from safest to wildest. Numbers from the JSON stay out unless the user asks for them.
- If the user asked for a single idea, pick by weighted draw over the probabilities and say alternatives exist.
- "More" or "keep going": run it again with the earlier ideas excluded.
- "Go deeper on 3": expand that one; no sampling needed.

If the user is writing a prompt for another LLM to brainstorm, hand them the block above with k and the threshold filled in.
