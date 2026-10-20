# Notes

## Decisions

**1. Amount representation and calculation**

- Chosen approach: [How are API amount strings parsed, represented, calculated, and formatted?]
- Alternatives considered: [For example, integer smallest-unit arithmetic vs. a decimal library.]
- Why: [Discuss precision, fee and USD calculations, rounding, invalid input, and implementation cost.]

**2. Balance immediately after a claim**

- Chosen approach: [What balance and claim status does the user see after submission?]
- Alternatives considered: [Compare a server balance with explicit claim status against a local reservation overlay. Link the AI discussion of at least two approaches in `ai-logs/`.]
- Why: [Explain how this avoids accidental repeat claims and misleading balance changes. Include stale snapshots, failures, multiple claims, and reloads.]

**3. Unknown claim result**

- Chosen approach: [What does the app show and do after a timeout or lost response?]
- Alternatives considered: [Describe the other recovery or retry behavior you considered.]
- Why: [Cover idempotency key and request-body reuse, persistence, retry timing, and how an unknown result differs from a rejection.]

## Working with AI

Use three **real** moments from your preserved conversations. Link each to its exact file or section in `ai-logs/` and describe your own judgment.

1. **Prompt revised:** [What you asked first] → [What was missing] → [How you changed the prompt and what improved]. Evidence: [link to `ai-logs/…`].
2. **Wrong or risky output:** [AI suggestion] → [How you checked and caught the problem] → [Correction]. Evidence: [link to `ai-logs/…`].
3. **Disagreement:** [Suggestion you rejected] → [Why you disagreed] → [What you chose]. Evidence: [link to `ai-logs/…`].

## Not done / known issues

- [What is missing or incomplete in the final submitted build? What would you do next?]
- [What defect or limitation did you observe, and how would you address it?]
- [What could you not verify, including live API or deployment behavior, if applicable?]
