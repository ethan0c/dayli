import { describe, expect, it } from 'vitest';
import { planCount } from '../src';

const ev = (category: string, icon: string | null = null) => ({ kind: 'event' as const, category, icon, isDeadline: icon === 'exam' });
const task = (isDeadline: boolean) => ({ kind: 'task' as const, category: 'school', icon: null, isDeadline });

describe('plan counts', () => {
  it('names what is there, in a fixed order', () => {
    expect(planCount([ev('school', 'exam'), ev('school')])).toBe('1 class · 1 exam');
    expect(planCount([ev('work'), ev('school'), ev('work'), ev('school')])).toBe('2 classes · 2 shifts');
    expect(planCount([task(true), task(true), task(false)])).toBe('2 due · 1 to-do');
  });
  it('falls back to plans past three kinds, and never says things', () => {
    const many = [ev('school'), ev('work'), task(true), task(false), ev('personal')];
    expect(planCount(many)).toBe('5 plans');
    expect(planCount([])).toBe('Nothing planned');
    expect(planCount(many)).not.toMatch(/thing/);
  });
});
