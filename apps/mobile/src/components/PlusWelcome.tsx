import { monthDay, localParts } from '@dayli/core';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Icon, type IconKey } from '@/components/Icon';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { durations, ease, enter, springs } from '@/lib/motion';
import type { Palette } from '@/theme';

/** Where each Plus feature starts. Every row does the thing; none of them only describes it. */
export type PlusDestination = 'import' | 'shifts' | 'canvas';

const FEATURES: { icon: IconKey; title: string; detail: string; to: PlusDestination }[] = [
  { icon: 'file', title: 'Import anything', detail: 'Syllabi, screenshots and texts, with no monthly count.', to: 'import' },
  { icon: 'work', title: 'Update your work schedule', detail: 'Screenshot the new one. Semli shows what moved before saving.', to: 'shifts' },
  { icon: 'book', title: 'Keep Canvas in sync', detail: 'New assignments land in your plan on their own.', to: 'canvas' },
];

/** The Plus features as rows that open each one: ink glyphs, no tiles, a highlight on press. */
export function PlusFeatures({ c, onGo }: { c: Palette; onGo: (to: PlusDestination) => void }) {
  return (
    <View>
      {FEATURES.map(({ icon, title, detail, to }, i) => (
        <Pressable key={to} accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`} onPress={() => onGo(to)}
          style={({ pressed }) => [styles.row, i < FEATURES.length - 1 ? { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth } : null,
            pressed ? { backgroundColor: c.row, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 } : null]}>
          <Icon name={icon} size={20} color={c.inkPrimary} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <T token="body" color={c.inkPrimary}>{title}</T>
            <T token="caption" color={c.inkSecondary}>{detail}</T>
          </View>
          <Icon name="chevronRight" size={16} color={c.inkTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * The one screen after a new purchase: a tick that lands with a short burst, what the person now
 * has (and, on a trial, when it ends and that a reminder comes first), then three ways to start.
 * `celebrate` is false when it is reopened from You → Semli Plus: same screen, no burst.
 */
export function PlusWelcome({ celebrate, trialEndsAt, onGo, onDone, c }: {
  celebrate: boolean; trialEndsAt?: string | null; onGo: (to: PlusDestination) => void; onDone: () => void; c: Palette;
}) {
  const trialDate = trialEndsAt ? monthDay(localParts(new Date(trialEndsAt)).date) : null;
  return (
    <Animated.View entering={enter.rise} style={{ gap: 32 }}>
      <View style={{ gap: 12 }}>
        <View style={styles.seal}>
          {celebrate ? <Burst c={c} /> : null}
          <Tick c={c} animate={celebrate} />
        </View>
        <T token="subhead" color={c.inkSecondary}>Semli <T token="subhead" color={c.accentInk}>Plus</T></T>
        <T token="displaySerif" color={c.inkPrimary} accessibilityRole="header">{celebrate ? 'You’re in.' : 'Your Plus.'}</T>
        <T token="body" color={c.inkSecondary}>
          {trialDate ? `Everything in Plus is yours, free until ${trialDate}. We’ll remind you two days before.` : 'Everything in Plus is yours. Thanks for backing Semli.'}
        </T>
      </View>
      <View style={{ gap: 8 }}>
        <T token="subhead" color={c.inkSecondary}>Start with one</T>
        <PlusFeatures c={c} onGo={onGo} />
      </View>
      <View style={{ gap: 12 }}>
        <Press haptic="tap" accessibilityRole="button" onPress={onDone} style={[styles.cta, { backgroundColor: c.controlFill }]}>
          <T token="headline" color={c.controlInk}>Done</T>
        </Press>
        <T token="caption" color={c.inkSecondary} style={{ textAlign: 'center' }}>This list stays in You → Semli Plus.</T>
      </View>
    </Animated.View>
  );
}

/** Green means done: the purchase went through. It pops in on the snappy spring with the burst. */
function Tick({ c, animate }: { c: Palette; animate: boolean }) {
  const p = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate) p.value = withSpring(1, springs.snappy);
  }, [animate, p]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 2), transform: [{ scale: 0.4 + 0.6 * p.value }] }));
  return (
    <Animated.View style={[styles.tick, { backgroundColor: c.added }, style]}>
      <Icon name="tick" size={30} color={c.onPrimary} strokeWidth={2.5} />
    </Animated.View>
  );
}

function Burst({ c }: { c: Palette }) {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    {Array.from({ length: 16 }, (_, i) => <Particle key={i} index={i} color={[c.accentInk, c.added, c.changed, c.inkPrimary][i % 4]} />)}
  </View>;
}

function Particle({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: durations.slow * 4, easing: ease });
  }, [progress]);
  const style = useAnimatedStyle(() => {
    const angle = index * Math.PI * 2 / 16;
    const distance = 52 + index % 3 * 16;
    return {
      opacity: Math.sin(progress.value * Math.PI),
      transform: [
        { translateX: Math.cos(angle) * distance * progress.value },
        { translateY: Math.sin(angle) * distance * progress.value + 16 * progress.value * progress.value },
        { rotate: `${index * 27 + progress.value * 120}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 12 },
  seal: { width: 64, height: 64, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', left: 29.5, top: 27, width: 5, height: 10, borderRadius: 2 },
  cta: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
