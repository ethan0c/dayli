import { describe, expect, it } from 'vitest';
import { freeImportAllowance, freeImportsLeft, hasFreeImports } from './plans';

const day = (n: number) => new Date(Date.UTC(2026, 9, n, 12));

describe('the free import allowance', () => {
  it('gives five to start, counted over the first thirty days whatever the month', () => {
    const usage = { month: '2026-10', imports: 2, firstImportAt: day(25).toISOString(), total: 2 };
    expect(freeImportAllowance(usage, day(28))).toEqual({ allowed: 5, used: 2, toStart: true });
    expect(freeImportsLeft({ ...usage, month: '2026-11', imports: 3, total: 5 }, new Date(Date.UTC(2026, 10, 10)))).toBe(0);
  });
  it('drops to three a month once the window closes', () => {
    const usage = { month: '2026-10', imports: 5, firstImportAt: day(1).toISOString(), total: 5 };
    expect(hasFreeImports(usage, day(20))).toBe(false);
    expect(freeImportAllowance(usage, new Date(Date.UTC(2026, 10, 2)))).toEqual({ allowed: 3, used: 0, toStart: false });
    expect(freeImportsLeft({ ...usage, month: '2026-11', imports: 3, total: 8 }, new Date(Date.UTC(2026, 10, 20)))).toBe(0);
  });
  it('treats a phone that never imported as starting out', () => {
    expect(freeImportAllowance({ month: '', imports: 0 })).toEqual({ allowed: 5, used: 0, toStart: true });
  });
  it('reads a stored usage from before the start window existed as ordinary months', () => {
    expect(freeImportAllowance({ month: '2026-10', imports: 2 }, day(19))).toEqual({ allowed: 5, used: 2, toStart: true });
  });
});
