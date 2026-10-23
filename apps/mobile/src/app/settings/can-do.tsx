import { ScrollView, StyleSheet, View } from 'react-native';

import { ListRow } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { track } from '@/lib/analytics';
import { useCanDo } from '@/lib/can-do';
import { feedback } from '@/lib/feedback';
import { SCREEN_GUTTER, useTheme } from '@/theme';

/** A list of things to try, each opening the real screen; ticked once the person's own plan shows it happened. */
export default function CanDoScreen() {
  const { c } = useTheme();
  const list = useCanDo();
  const tried = list.filter((t) => t.done).length;
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.top}>
        <T token="callout" color={c.inkSecondary}>Tried so far</T>
        <T token="displayXl" tabular>{`${tried} of ${list.length}`}</T>
        <T token="lead" color={c.inkSecondary} style={styles.line}>Select a feature to open it. Paid features are marked Plus.</T>
      </View>
      <View>
        {list.map((t, i) => (
          <ListRow key={t.id} title={t.title} sub={t.done ? 'Done' : `${t.sub}${t.plus ? ' · Plus' : ''}`} last={i === list.length - 1} chevron={!t.done}
            trailing={t.done ? <Icon name="tick" size={18} color={c.added} /> : undefined}
            accessibilityLabel={`${t.title}${t.done ? ', done' : ''}`}
            onPress={() => { feedback('tap'); track('can_do', { item: t.id, done: t.done }); t.go(); }} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 48, gap: 22 },
  top: { gap: 2 },
  line: { paddingTop: 6 },
});
