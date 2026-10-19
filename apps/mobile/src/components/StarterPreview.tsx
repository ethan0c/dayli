import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { starterCards, type StarterCard } from '@/lib/planner-preview';
import { useStore } from '@/store';
import { useCardSurface, useTheme } from '@/theme';

/** A populated first-run preview, separate from real items, counts, and reminders. */
export function StarterPreview({ school = false }: { school?: boolean }) {
  const { c } = useTheme();
  const settings = useStore((s) => s.settings);
  const cards = starterCards(settings, school);
  return <View style={styles.content}>
    <View style={styles.intro}>
      <T token="caption" color={c.accentInk}>Your preview</T>
      <T token="title">{settings.name.trim() ? `${settings.name.trim()}, ` : ''}{school ? 'bring your semester together.' : 'start with what you have.'}</T>
      <T token="callout" color={c.inkSecondary}>Here’s what your plan could look like. Add your own details to make it yours.</T>
    </View>
    {cards.map((card) => <StarterUploadCard key={card.id} card={card} />)}
    <T token="caption" color={c.inkSecondary}>Examples only. They aren’t on your calendar and won’t send reminders. You review your uploads before anything is added.</T>
  </View>;
}

function StarterUploadCard({ card }: { card: StarterCard }) {
  const { c } = useTheme();
  const surface = useCardSurface();
  const open = () => {
    feedback('tap');
    useStore.getState().setCaptureDraft('');
    router.push({ pathname: '/capture', params: card.source ? { source: card.source } : {} });
  };
  return <View style={[styles.card, surface]}>
    <Pressable accessibilityRole="button" onPress={open} style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: c.accentSoft }]}><Icon name={card.id === 'work' ? 'image' : card.id === 'school' ? 'file' : 'pen'} size={21} color={c.accentInk} /></View>
      <View style={styles.actionText}><T token="headline">{card.title}</T><T token="caption" color={c.inkSecondary}>{card.detail}</T></View>
      <Icon name="chevronRight" size={17} color={c.inkSecondary} />
    </Pressable>
    <View style={[styles.examples, { backgroundColor: c.row }]}>
      <T token="caption" color={c.inkSecondary}>Example · after you add your details</T>
      {card.examples.map((row) => <View key={row.title} style={styles.example}>
        <Icon name={row.icon} size={17} color={c.inkSecondary} />
        <View style={styles.actionText}><T token="callout">{row.title}</T>{row.chip ? <T token="caption" color={c.inkSecondary}>{row.chip}</T> : null}</View>
      </View>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  intro: { gap: 8, paddingBottom: 2 },
  card: { padding: 18, gap: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  actionText: { flex: 1, minWidth: 0, gap: 4 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  examples: { borderRadius: 12, padding: 14, gap: 12 },
  example: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
