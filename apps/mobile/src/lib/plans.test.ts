import { describe, expect, it } from 'vitest';
import { hasFreeImports } from './plans';

const at = new Date('2026-10-19T12:00:00Z');
describe('free import allowance', () => {
  it('allows three imports, then requires Plus', () => {
    for (const imports of [0, 1, 2]) expect(hasFreeImports({ month: '2026-10', imports }, at)).toBe(true);
    for (const imports of [3, 4, 100]) expect(hasFreeImports({ month: '2026-10', imports }, at)).toBe(false);
  });
  it('resets at the same UTC month boundary used by the import counter', () => {
    const usage = { month: '2026-10', imports: 3 };
    expect(hasFreeImports(usage, new Date('2026-10-31T23:59:59Z'))).toBe(false);
    expect(hasFreeImports(usage, new Date('2026-11-01T00:00:00Z'))).toBe(true);
  });
});
