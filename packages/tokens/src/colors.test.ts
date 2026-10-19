import { describe, expect, it } from 'vitest';
import { palettes } from './index';

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/../g)!.map((part) => {
    const value = parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function contrast(a: string, b: string): number {
  const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (light! + 0.05) / (dark! + 0.05);
}

describe.each(Object.entries(palettes))('%s theme', (_name, c) => {
  it('keeps small text legible on planner, menu, sheet, and paywall surfaces', () => {
    for (const fill of [c.canvas, c.header, c.row, c.surface, c.accentSoft]) {
      for (const ink of [c.inkPrimary, c.inkSecondary, c.inkTertiary]) expect(contrast(ink, fill), `${ink} on ${fill}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const { fill, ink } of Object.values(c.tint)) expect(contrast(ink, fill)).toBeGreaterThanOrEqual(4.5);
    for (const [ink, fill] of [[c.onPrimary, c.inkPrimary], [c.onAccent, c.accent], [c.onNav, c.nav], [c.navInactive, c.nav],
      [c.conflict, c.conflictBg], [c.changed, c.changedBg], [c.added, c.addedBg], [c.accentInk, c.accentSoft]]) {
      expect(contrast(ink!, fill!), `${ink} on ${fill}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('keeps empty completion controls visible', () => {
    expect(contrast(c.controlOutline, c.canvas)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.controlOutline, c.row)).toBeGreaterThanOrEqual(3);
  });
});
