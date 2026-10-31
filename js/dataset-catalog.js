// Static, reproducible, synthetic examples — NOT live prices or observed quotes.
export const DATASETS = Object.freeze([
  { id: 'sample', name: 'Sample volatility smile', path: 'data/sample-surface.json' },
  { id: 'skew', name: 'Downside skew (synthetic)', path: 'data/skew-surface.json' },
  { id: 'flat', name: 'Flat volatility (synthetic)', path: 'data/flat-surface.json' },
  { id: 'term', name: 'Term structure (synthetic)', path: 'data/term-surface.json' }
]);
export function findDataset(id) {
  const entry = DATASETS.find(item => item.id === id);
  if (!entry) throw new Error(`Unknown dataset: ${id}`);
  return entry;
}
