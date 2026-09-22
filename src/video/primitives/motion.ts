// The `primitives/motion` layer the target architecture (docs/ARCHITECTURE.md) calls for. Re-exports
// src/lib/anim.ts verbatim rather than moving it — every existing Film.tsx/scene file already imports from
// '../lib/anim' (or a relative equivalent) and stays untouched; only NEW code under src/video/ imports from
// here. See docs/ARCHITECTURE.md "Migration strategy" step 1.
export * from '../../lib/anim';
