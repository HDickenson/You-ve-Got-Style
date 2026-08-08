/**
 * This project does not ship `@types/react` (it is absent from package.json and
 * the lockfile, not just from node_modules), so React's own prop helpers —
 * `ComponentProps`, `ReactNode`, `CSSProperties`, `RefObject` — resolve to
 * nothing and every React value is already `any` at the type level.
 *
 * These aliases stand in for them so the primitives still declare their real
 * shape (`variant`, `size`, `gap`) while the pass-through DOM props stay open.
 * If `@types/react` is ever added, swap each alias for the real helper and the
 * component signatures below do not have to change.
 */

/** Pass-through DOM/element props. */
export type ElementProps = Record<string, any>;

/** Anything React can render. */
export type Renderable = any;
