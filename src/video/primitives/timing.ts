// The `primitives/timing` layer the target architecture (docs/ARCHITECTURE.md) calls for — word-anchored
// beat timing, the one deliberate BUILD in docs/OPEN_SOURCE_RESEARCH.md's reuse matrix (no timeline/editor
// library found models "a beat anchored to the Nth spoken occurrence of a word"). Re-exports src/lib/beats.ts
// verbatim; see src/video/primitives/motion.ts for why this is a re-export, not a move.
export * from '../../lib/beats';
