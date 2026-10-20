import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon, type IconKey } from '@/components/Icon';
import { Press } from '@/components/Press';
import { T } from '@/components/Text';
import { durations, ease, enter } from '@/lib/motion';
import type { Palette } from '@/theme';

const FEATURES: { icon: IconKey; title: string; detail: string; where: string }[] = [
  { icon: 'image', title: 'Import without counting', detail: 'Turn screenshots, PDFs and pasted text into your plan. No monthly import limit.', where: 'Add → choose a photo, file or text' },
  { icon: 'work', title: 'Keep up with shift changes', detail: 'Compare a new work schedule with the old one. Review what changed before saving.', where: 'Add → upload your updated work schedule' },
  { icon: 'clock', title: 'Find room for the flexible stuff', detail: 'Get a suggested time when plans overlap. Your fixed shifts stay put; you choose what moves.', where: 'Plan → open an overlapping flexible event' },
];

export function PlusFeatures({ c }: { c: Palette }) {
  return (
    <View style={{ gap: 24 }}>
      {FEATURES.map(({ icon, title, detail, where }) => (
        <View key={title} style={styles.feature}>
          <View style={[styles.icon, { backgroundColor: c.selectionFill }]}><Icon name={icon} size={22} color={c.accentInk} /></View>
          <View style={{ flex: 1, gap: 5 }}>
            <T token="headline" color={c.inkPrimary}>{title}</T>
            <T token="callout" color={c.inkSecondary}>{detail}</T>
            <T token="caption" color={c.accentInk} style={{ paddingTop: 3 }}>{where}</T>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PlusWelcome({ stage, onTour, onDone, c }: {
  stage: 'celebrate' | 'tour'; onTour: () => void; onDone: () => void; c: Palette;
}) {
  const celebration = stage === 'celebrate';
  return (
    <Animated.View key={stage} entering={enter.rise} style={{ gap: 32 }}>
      <View style={{ gap: 12 }}>
        <T token="subhead" color={c.accentInk}>{celebration ? 'Semli Plus · 1 of 2' : 'Your Plus guide · 2 of 2'}</T>
        {celebration ? <View style={styles.seal}>
          <Burst c={c} />
          <View style={[styles.badge, { backgroundColor: c.selectionFill }]}><Icon name="sparkle" size={38} color={c.accentInk} /></View>
        </View> : null}
        <T token="displaySerif" color={c.inkPrimary} accessibilityRole="header">{celebration ? 'You’re in.\nWelcome to Plus.' : 'A little less\njuggling.'}</T>
        <T token="body" color={c.inkSecondary}>{celebration ? 'More room for your week. Thanks for making Semli part of it.' : 'Here’s what you’ve unlocked, and where to find it.'}</T>
      </View>
      {celebration ? (
        <T token="callout" color={c.inkSecondary}>Your plan and everything you’ve already added are right here. Let’s take a quick look around.</T>
      ) : <PlusFeatures c={c} />}
      <View style={{ gap: 12 }}>
        <Press haptic="tap" accessibilityRole="button" onPress={celebration ? onTour : onDone} style={[styles.cta, { backgroundColor: c.controlFill }]}>
          <T token="headline" color={c.controlInk}>{celebration ? 'Show me around' : 'Let’s go'}</T>
        </Press>
        {celebration ? <Press accessibilityRole="button" onPress={onDone} style={styles.skip}><T token="subhead" color={c.inkSecondary}>Explore later</T></Press> :
          <T token="caption" color={c.inkSecondary}>You can find this guide again in You → Semli Plus.</T>}
      </View>
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
    const distance = 64 + index % 3 * 18;
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
  feature: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  seal: { width: 88, height: 88, marginVertical: 16, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', left: 41, top: 41, width: 5, height: 10, borderRadius: 2 },
  cta: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
