import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryDot, ListRow, SectionTitle, StatusPill } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Check } from '@/components/ItemRow';
import { T } from '@/components/Text';
import { TabHeader } from '@/components/TabHeader';
import { feedback } from '@/lib/feedback';
import { useStore } from '@/store';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/**
 * Today and Plan before anything is added: three ways to start as rows, then two
 * example rows showing what the screen will look like. No cards, no tiles.
 */
export function TodayStart({ date, tab = 'Today', header }: { date: string; tab?: 'Today' | 'Plan'; header?: ReactNode }) {
  const { c } = useTheme();
  const open = (source?: 'image' | 'file') => {
    feedback('tap');
    useStore.getState().setCaptureDraft('');
    if (source) router.navigate({ pathname: '/add', params: { source, at: String(Date.now()) } });
    else router.navigate('/add');
  };
  return (
    <View>
      {header ?? <TabHeader date={date} title={tab} size="title"
        details={<T token="callout" color={c.inkSecondary}>Add events or tasks to see them here. Review imports before saving.</T>} />}

      <View style={styles.section}>
        <SectionTitle title="Start with" />
        <ListRow title="A work schedule" sub="A screenshot from the scheduling app or the group chat" leading={<Icon name="image" size={20} color={c.inkPrimary} />} onPress={() => open('image')} />
        <ListRow title="A syllabus" sub="Classes, exams and due dates for the whole term" leading={<Icon name="file" size={20} color={c.inkPrimary} />} onPress={() => open('file')} />
        <ListRow title="Type your plans" sub="“I work Friday 4–10 and have an exam Monday”" leading={<Icon name="pen" size={20} color={c.inkPrimary} />} onPress={() => open()} last />
      </View>

      <View style={styles.section}>
        <SectionTitle title="Example schedule" />
        <View style={styles.examples} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.row, { borderBottomColor: c.line }]}>
            <View style={styles.lead}><CategoryDot color={c.inkPrimary} /></View>
            <View style={styles.text}>
              <T token="body">Café shift</T>
              <T token="caption" color={c.inkSecondary}>Campus Café · Work</T>
            </View>
            <StatusPill label="4:00 pm" />
          </View>
          <View style={[styles.row, { borderBottomColor: c.line }]}>
            <View style={styles.lead}><Check done={false} /></View>
            <View style={styles.text}>
              <T token="body">Read chapter 6</T>
              <T token="caption" color={c.inkSecondary}>PSYC 101</T>
            </View>
            <StatusPill label="Due today" tone="red" tabular={false} />
          </View>
        </View>
        <T token="caption" color={c.inkSecondary} style={{ paddingTop: 10 }}>Example items only. They aren’t saved and won’t send reminders.</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 26 },
  examples: { opacity: 0.55 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth },
  lead: { width: 22, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
