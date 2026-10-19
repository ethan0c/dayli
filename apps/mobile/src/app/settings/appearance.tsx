import { ScrollView, StyleSheet, View } from 'react-native';

import { Group, Row } from '@/components/Settings';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { SCREEN_GUTTER, useCardSurface, useTheme } from '@/theme';
import { useStore, type Appearance, type CardStyle } from '@/store';

const OPTIONS: { id: Appearance; label: string }[] = [
  { id: 'system', label: 'Match iPhone' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function AppearanceScreen() {
  const appearance = useStore((s) => s.settings.appearance);
  const cardStyle = useStore((s) => s.settings.cardStyle);
  const surface = useCardSurface('accent');
  const { c } = useTheme();
  const setSettings = useStore((s) => s.setSettings);
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group footer="Applies to your planner, sheets, menus, and Semli Plus.">
        {OPTIONS.map((o, i) => (
          <Row
            key={o.id}
            label={o.label}
            selected={appearance === o.id}
            onPress={() => {
              feedback('select');
              setSettings({ appearance: o.id });
            }}
            last={i === OPTIONS.length - 1}
          />
        ))}
      </Group>
      <Group title="Card style" footer="Changes featured cards, course cards, and review cards. Agenda rows stay open.">
        {([{ id: 'flat', label: 'Flat' }, { id: 'raised', label: 'Raised' }] satisfies { id: CardStyle; label: string }[]).map((option, i) => <Row key={option.id} label={option.label} selected={cardStyle === option.id} last={i === 1} onPress={() => { feedback('select'); setSettings({ cardStyle: option.id }); }} />)}
      </Group>
      <View style={[styles.preview, surface]}>
        <T token="subhead" color={c.accentInk}>Card preview</T>
        <T token="title">Your next commitment</T>
        <T token="callout" color={c.inkSecondary}>Same layout. Your choice of depth.</T>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, gap: 28 }, preview: { padding: 20, gap: 8 } });
