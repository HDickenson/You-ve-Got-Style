# Branching — layered stack + isolated worktrees

Why this exists: four build agents editing one working tree race each other. They already
collided once on `src/data/sampleLooks.ts`. Isolation is structural, not a discipline
problem — give each unit of work its own worktree and its own branch.

## The stack

```
main
└── feat/brand-foundation                      PR #1  — tokens, type, primitives, shell
    ├── feat/flow-capture                      PR #2  — HandsFreeCapture + SizingEngine
    ├── feat/flow-guardrails                   PR #3  — StyleGuardrails
    ├── feat/flow-discovery                    PR #4  — SwipeDiscovery
    └── feat/flow-capsule                      PR #5  — CapsuleWardrobe + CheckoutModal
```

Two layers. Layer 1 is the foundation everything depends on. Layer 2 is four **siblings**,
each branched off the foundation.

**Siblings, deliberately — not a linear chain.** A linear stack
(`capture → guardrails → discovery → capsule`) would put every parent's diff inside every
child PR, force a serial merge order, and mean a change to capture rebases three branches
below it. The flow groups touch disjoint files, so they are genuinely independent. Layering
them as siblings gives four small PRs that each diff cleanly against the foundation and can
merge in any order.

The cost of siblings is that they do not see each other's work until integration — which is
exactly why the integration step below is not optional.

## Worktrees

| Branch | Worktree |
|---|---|
| `feat/brand-foundation` | `Projects/YGS/app` (primary) |
| `feat/flow-capture` | `Projects/YGS/wt/capture` |
| `feat/flow-guardrails` | `Projects/YGS/wt/guardrails` |
| `feat/flow-discovery` | `Projects/YGS/wt/discovery` |
| `feat/flow-capsule` | `Projects/YGS/wt/capsule` |

Each worktree's `node_modules` is a **junction** to the primary checkout's, so four
worktrees cost one install. Consequence worth knowing: a dependency change in any worktree
is visible to all of them, so `package.json` edits belong on the foundation layer, never in
a flow branch.

```powershell
git worktree add -b feat/flow-<name> ..\wt\<name> feat/brand-foundation
New-Item -ItemType Junction -Path ..\wt\<name>\node_modules -Target .\node_modules
```

## File ownership — the rule that makes siblings safe

| Branch | Owns |
|---|---|
| `feat/brand-foundation` | `src/index.css`, `src/lib/`, `src/components/{ui,layout,brand}/`, `src/App.tsx`, `HeaderNav.tsx`, `DESIGN.md`, `package.json` |
| `feat/flow-capture` | `HandsFreeCapture.tsx`, `SizingEngine.tsx` |
| `feat/flow-guardrails` | `StyleGuardrails.tsx` |
| `feat/flow-discovery` | `SwipeDiscovery.tsx` |
| `feat/flow-capsule` | `CapsuleWardrobe.tsx`, `CheckoutModal.tsx` |

A flow branch **must not** edit a foundation-owned file. If a flow needs a shared change —
a new primitive, a token, a changed prop contract — that is a foundation change: raise it,
land it on `feat/brand-foundation`, and rebase the flows onto it. Silently editing
`index.css` from a flow branch is how four clean PRs become one merge conflict.

`src/types.ts` and `src/data/` are shared. Treat them as foundation-owned; a flow that needs
a new field asks for it rather than adding it locally.

## Integrating

Merge order is free (siblings), but validate after **each** merge, not once at the end:

```powershell
git checkout feat/brand-foundation
git merge --no-ff feat/flow-capture
npx tsc --noEmit; npx impeccable detect src/
# repeat per flow, fixing before the next merge
```

Or use the `worktree-merge` skill, which does exactly this through a throwaway integration
branch and refuses to touch the main line until the full suite passes.

Cross-flow visual drift — spacing rhythm, card treatment, button hierarchy, empty states,
focus rings, motion timing — is the expected failure mode of parallel work and will not show
up as a merge conflict. It is caught by the integration pass and the final brand critique,
not by git.

## Cleanup

```powershell
git worktree remove ..\wt\<name>
git worktree prune
```
