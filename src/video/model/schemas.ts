// Single import surface for every model schema (docs/ARCHITECTURE.md's suggested `model/schemas.ts`). The
// schemas themselves live next to their type (asset.ts, clip.ts, track.ts, project.ts) via z.infer, so the
// runtime validator and the TS type can never drift apart — this file just re-exports them together.
export * from './asset';
export * from './clip';
export * from './track';
export * from './project';
