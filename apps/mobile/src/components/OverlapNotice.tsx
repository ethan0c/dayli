import { findConflicts, formatRange, isFlexibleEvent, localParts, suggestReschedule } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GroupLabel, TextButton } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useNow } from '@/lib/now';
import { realRecords } from '@/lib/planner-preview';
import { hasSemliPro, purchaseErrorMessage } from '@/lib/revenuecat';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { useTheme } from '@/theme';

/** Free conflict facts, with an explicitly confirmed Plus suggestion for the flexible event. */
export function OverlapNotice({ item, items }: { item: Item; items: Item[] }) {
  const { c } = useTheme();
  const now = useNow();
  const { isPro, loading, refreshCustomerInfo } = usePurchases();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const otherIds = new Set(findConflicts(items).flatMap((pair) => pair.a === item.id ? [pair.b] : pair.b === item.id ? [pair.a] : []));
  const others = items.filter((other) => otherIds.has(other.id));
  if (!others.length) return null;
  const flexible = isFlexibleEvent(item);
  const movable = others.filter(isFlexibleEvent);
  const upcoming = item.start && `${item.date}T${item.start}` > `${now.date}T${now.time}`;
  const suggestion = isPro ? suggestReschedule(item, items, now) : null;

  async function applySuggestion() {
    if (!suggestion || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      // Recheck paid access and availability before changing the selected occurrence.
      const info = await refreshCustomerInfo();
      if (!hasSemliPro(info)) {
        router.push('/settings/plan');
        return;
      }
      const store = useStore.getState();
      const latest = store.items[item.id];
      const slot = latest && suggestReschedule(latest, realRecords(Object.values(store.items)), localParts(new Date()));
      if (!latest || latest.date !== item.date || latest.start !== item.start || latest.end !== item.end
        || !slot || slot.start !== suggestion.start || slot.end !== suggestion.end || slot.date !== suggestion.date) {
        setNotice('Your calendar changed. Review the updated time before moving it.');
        return;
      }
      store.updateItem(item.id, slot);
      const batchId = useStore.getState().batches[0]?.id;
      store.showToast(`Moved ${latest.title} to ${formatRange(slot.start, slot.end)}.`, batchId);
      feedback('success');
    } catch (error) {
      setNotice(purchaseErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { borderTopColor: c.line }]}>
      <View style={styles.heading}>
        <Icon name="alert" size={18} color={c.conflict} />
        <T token="subhead" color={c.conflict} accessibilityRole="header">Time overlap</T>
      </View>
      {others.map((other) => (
        <View key={other.id} style={styles.fact}>
          <T token="body">{`Overlaps with ${other.title}${other.start && other.end ? ` (${formatRange(other.start, other.end)})` : ''}.`}</T>
          <TextButton label={`View ${other.title}`} tone="muted" onPress={() => router.push(`/item/${other.id}`)} style={styles.link} />
        </View>
      ))}
      {!flexible ? (
        <>
          <T token="callout" color={c.inkSecondary}>{item.category === 'work' ? 'Keep your shift as scheduled.' : 'This time is fixed.'}{movable.length ? ' The other plan may be easier to move.' : ' Check whether either commitment can change before editing its time.'}</T>
          {movable.map((other) => <TextButton key={other.id} label={`Review ${other.title} instead`} onPress={() => router.push(`/item/${other.id}`)} style={styles.link} />)}
        </>
      ) : !upcoming ? (
        <T token="callout" color={c.inkSecondary}>This event has already started. You can still edit its time above.</T>
      ) : loading && !isPro ? (
        <T token="callout" color={c.inkSecondary}>Checking Plus access…</T>
      ) : !isPro ? (
        <View style={styles.suggestion}>
          <GroupLabel>Semli Plus</GroupLabel>
          <T token="callout" color={c.inkSecondary}>Find a free time for this event around your fixed commitments. Overlap warnings and manual edits are always free.</T>
          <Button label="Find a time with Plus" variant="secondary" onPress={() => router.push('/settings/plan')} />
        </View>
      ) : suggestion ? (
        <View style={styles.suggestion}>
          <GroupLabel>Suggested time · Plus</GroupLabel>
          <T token="title">{formatRange(suggestion.start, suggestion.end)}</T>
          <T token="callout" color={c.inkSecondary}>Same day, same duration, with 15 minutes between plans. This slot is free in your calendar. Check with anyone joining you before moving it.</T>
          {item.seriesId ? <T token="caption" color={c.inkSecondary}>Only this occurrence will move.</T> : null}
          <Button label={busy ? 'Checking…' : `Move to ${formatRange(suggestion.start, suggestion.end)}`} disabled={busy} onPress={() => void applySuggestion()} />
        </View>
      ) : (
        <T token="callout" color={c.inkSecondary}>No suitable free time found today between 8 am and 10 pm. Unknown event times can also prevent a suggestion. You can choose another time or date above.</T>
      )}
      {notice ? <T token="callout" color={c.conflict} accessibilityRole="alert">{notice}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20, paddingBottom: 10, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fact: { gap: 2 },
  link: { alignSelf: 'flex-start', minHeight: 44 },
  suggestion: { gap: 12, paddingTop: 4 },
});
