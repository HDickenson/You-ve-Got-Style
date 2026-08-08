---
name: ygs-definition-of-done
description: Done is five gates - goal, UX, UI, functionality, output - each owned by someone who did not build the thing. A builder can only reach 'Ready for gates'. Use before claiming any work complete.
---
Nothing is done because you say it is. Done is five gates, each owned by someone who did
not build the thing, each requiring evidence rather than assertion.

If you are the builder, you can reach **Ready for gates**. You cannot reach done. That is
not bureaucracy — it is the brief's requirement that work be "presented as ready for
independent validation rather than self-certifying it."

---

## The five gates

| # | Gate | Question it answers | Owner |
|---|---|---|---|
| 1 | **Goal** | Did this move the customer outcome the card claimed? | Aria |
| 2 | **UX** | Is the journey easier, not just prettier? | Rune |
| 3 | **UI** | Is it on-brand, composed for both devices, accessible? | Vero |
| 4 | **Functionality** | Does it actually work, including when it fails? | Odin |
| 5 | **Output** | Can someone else verify this without you? | Odin + Suri |

A gate owner never gates their own build. If you built it, you hand it on.

---

## Gate 1 — GOAL (Aria)

The card states a customer outcome. Not a task, an outcome.

- [ ] The stated outcome is now true, and you can say how you know.
- [ ] The change reduces a **named** hesitation from one of the five moments — discovery,
      understanding, comparison, decision, progression.
- [ ] It did not add a step, a screen, a decision or a thing to read. If it did, state
      what larger friction it removed in exchange.
- [ ] It did not silently change the product objective, a required capability, or the
      intended customer journey. If it should, that is a separate card.

**Fails if:** the work is technically complete but the customer's reason to hesitate is
unchanged.

## Gate 2 — UX (Rune)

- [ ] The journey works end to end, not just the component in isolation.
- [ ] Progressive disclosure holds: the first screen answers the primary question; depth
      is available, never default.
- [ ] Three actions per screen maximum. A fourth means something else must go.
- [ ] Every state is designed and reachable: empty, loading, partial, error, offline, and
      the slow path at three seconds.
- [ ] The customer can get back to something they have already seen.
- [ ] Copy is in the product voice — outcomes, not machinery. No model names, no
      apologetic boilerplate, no technical theatre.

**Fails if:** a state exists in code but was never designed, or the happy path is the only
path that was walked.

## Gate 3 — UI (Vero)

- [ ] Brand tokens only. No raw hex outside the token layer, no off-brand palettes.
- [ ] Gold is rationed — counted on the rendered screen, not in the source.
- [ ] Ground is correct: dark is theatre, cream is conversation, Forest is Style
      Intelligence only.
- [ ] Two voices held: serif for editorial moments only, never on a control, price or
      setting.
- [ ] Spacing on scale, radius on scale, motion within the four named transitions.
- [ ] `prefers-reduced-motion` respected.
- [ ] **Tablet composed, not stretched** — verified at 820×1180 and 1180×820, both
      orientations. Extra space became columns, capped measures or a second pane.
- [ ] Contrast meets AA against the actual ground. Focus visible. Targets ≥44px.

**Fails if:** it looks right on a phone and was merely widened for tablet.

## Gate 4 — FUNCTIONALITY (Odin)

- [ ] It works when things go right — demonstrated, not reasoned about.
- [ ] It works when things go wrong: the failure path is visibly distinct to the customer.
      Placeholder content is never returned with a success flag.
- [ ] The slow path was observed. Something honest is on screen at three seconds.
- [ ] Hard constraints fail **closed**, never open.
- [ ] `tsc --noEmit`, `npm run build` and the detector all run, with counts compared
      against a measured baseline — not a remembered one.
- [ ] No regression in a journey the card did not touch.

**Fails if:** only the success path was exercised.

## Gate 5 — OUTPUT (Odin, with Suri on claims)

- [ ] Every rendered fact is computed. No literal masquerading as a measurement, no
      unconditional verdict, no invented confidence. **Prefer absence to fabrication.**
- [ ] Evidence captured at all three viewports and attached to the card.
- [ ] Commands quoted verbatim with their output and exit codes.
- [ ] Confirmed-by-evidence is separated from believed-but-unverified.
- [ ] What was **not** verified is stated plainly.
- [ ] The card's own acceptance criteria are checked one by one, each with its evidence.
- [ ] `pr_url` metadata set; issue moved on the same action as the merge.

**Fails if:** the report asserts something no artifact demonstrates.

---

## The handoff chain

```
Builder            -> Ready for gates   (never "done")
Vero               -> UI gate           PASS | REVISE  (file:line findings)
Odin               -> Functionality + Output gates      (evidence attached)
Suri               -> Claims + compliance                (may block outright)
Rune               -> UX gate                            (journey, not component)
Aria               -> Goal gate -> DONE                  (the only one who closes)
```

Each gate comments its verdict on the card. A REVISE returns it to the builder with
`file:line` findings — it does not silently sit in review. Aria is the only role that
moves a card to `done`, and only after the other four have passed on the record.

## Definition of NOT done

Any one of these means it is not done, regardless of how complete the code looks:

- A stated acceptance criterion is unmet — name it and why.
- A gate owner has not commented.
- The only evidence is that it compiles.
- Tablet was never opened.
- The failure path was never triggered.
- The UI claims something the code does not compute.
- The card's description is now false because the code moved on.
- You are the builder and you are the one calling it done.

## Partial done is a real state, and it is honest

If four gates pass and one fails, say exactly that. Move the card to `in_review` with the
failing gate named. **Do not round up.** A card marked done that is 90% done is worse than
one marked blocked, because it removes itself from everyone's attention.

