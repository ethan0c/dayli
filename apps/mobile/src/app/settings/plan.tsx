import { ScrollView, StyleSheet, View } from 'react-native';

import { PlanPicker } from '@/components/PlanPicker';
import { T } from '@/components/Text';
import { FREE_IMPORTS_PER_MONTH, PLANS } from '@/lib/plans';
import { useStore } from '@/store';
import { SCREEN_GUTTER, radius, useTheme } from '@/theme';

export default function PlanScreen() {
  const { c } = useTheme();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const usage = useStore((s) => s.usage);
  const month = new Date().toISOString().slice(0, 7);
  const used = usage.month === month ? usage.imports : 0;
  const left = Math.max(0, FREE_IMPORTS_PER_MONTH - used);
  const chosen = PLANS.find((p) => p.id === settings.planIntent);

  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.status, { backgroundColor: c.tint.mint.fill }]}>
        <T token="overline" color={c.tint.mint.ink}>
          Free plan
        </T>
        <T token="display" color={c.tint.mint.ink}>
          {left} {left === 1 ? 'import' : 'imports'} left
        </T>
        <T token="callout" color={c.tint.mint.ink}>
          {used} of {FREE_IMPORTS_PER_MONTH} used this month. Reminders, the calendar, and to-dos are always free.
        </T>
      </View>

      <PlanPicker
        student={settings.isStudent}
        onStudent={(isStudent) => setSettings({ isStudent })}
        plan={settings.planIntent}
        onPlan={(planIntent) => setSettings({ planIntent })}
      />

      <T token="caption" color={c.inkSecondary}>
        {chosen ? `You picked ${chosen.name}. ` : ''}
        Buying is not switched on in this beta yet. Your choice is saved, and you will get it at this price when it is.
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, paddingBottom: 48, gap: 20 },
  status: { padding: 18, borderRadius: radius.card, gap: 4 },
});
