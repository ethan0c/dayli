import { formatRange, monthDay, weekdayShort, type MovableOverlap } from '@dayli/core';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { GroupLabel, TextButton } from '@/components/Controls';
import { T } from '@/components/Text';
import { track } from '@/lib/analytics';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

/**
 * The one-time note on Today for the first overlap Semli could resolve. It points at the real
 * clash in the person's plan and opens the event, where the suggested time (or the Plus ask) is.
 * Seen once, it never returns; the red rows and the overlap section on the event stay.
 */
export function FirstOverlap({ overlap, today }: { overlap: MovableOverlap; today: string }) {
  const { c } = useTheme();
  const { isPro } = usePurchases();
  const setSettings = useStore((s) => s.setSettings);
  const { flexible, other } = overlap;
  useEffect(() => { track('first_overlap', { action: 'shown' }); }, []);

  const when = flexible.date === today ? 'today' : `${weekdayShort(flexible.date)}, ${monthDay(flexible.date)}`;
  const time = flexible.start && flexible.end ? ` (${formatRange(flexible.start, flexible.end)})` : '';
  const seen = (action: 'opened' | 'dismissed') => {
    track('first_overlap', { action, pro: isPro });
    setSettings({ firsts: { ...useStore.getState().settings.firsts, overlap: true } });
  };

  return (
    <View style={styles.root} accessibilityRole="summary">
      <GroupLabel>Your first overlap</GroupLabel>
      <T token="body">{`${flexible.title} overlaps ${other.title} ${when}${time}.`}</T>
      <T token="callout" color={c.inkSecondary}>
        {isPro
          ? `Semli marks overlaps red as plans come in, and keeps the one that can’t move. Open this one for a free time for ${flexible.title}; ${other.title} stays where it is.`
          : `Semli marks overlaps red as plans come in, and keeps the one that can’t move. With Plus, it finds a free time for ${flexible.title} and moves it in one tap; ${other.title} stays where it is.`}
      </T>
      <View style={styles.actions}>
        <TextButton label="See it" onPress={() => { seen('opened'); router.push(`/item/${flexible.id}`); }} accessibilityLabel={`See ${flexible.title}`} />
        <TextButton label="Got it" tone="muted" onPress={() => seen('dismissed')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 4 },
});
