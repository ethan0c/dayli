import { useRef } from 'react';
import { PlanPicker } from '@/components/PlanPicker';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palettes } from '@dayli/tokens';

import { Photo } from '@/components/Photo';
import { SHOWCASE } from '@/lib/images';
import { SCREEN_GUTTER } from '@/theme';

/** The same fireworks and fade used by the onboarding showcase, in either appearance. */
export function PaywallBackdrop() {
  const canvas = palettes.dark.canvas;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Photo source={SHOWCASE.plus} style={styles.photo} />
      <View style={[styles.photo, { backgroundColor: canvas, opacity: 0.3 }]} />
      <View style={styles.fade}>
        {Array.from({ length: 28 }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: canvas, opacity: Math.pow((i + 1) / 28, 1.4) }} />
        ))}
      </View>
    </View>
  );
}

export function PhotoPaywall(props: { onContinueFree?: () => void; onComplete?: () => void; freeImportsLeft?: number }) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <PaywallBackdrop />
      <ScrollView ref={scroll} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 150, paddingBottom: Math.max(insets.bottom, 24) + 24 }]}>
        <PlanPicker {...props} palette={palettes.dark} onWelcome={() => scroll.current?.scrollTo({ y: 0, animated: false })} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palettes.dark.canvas },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, height: 460 },
  fade: { position: 'absolute', top: 120, left: 0, right: 0, height: 340 },
  body: { flexGrow: 1, paddingHorizontal: SCREEN_GUTTER },
});
