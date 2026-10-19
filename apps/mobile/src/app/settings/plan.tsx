import { ScrollView, StyleSheet } from 'react-native';

import { PlanPicker, closePaywall } from '@/components/PlanPicker';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/plans';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useStore } from '@/store';
import { SCREEN_GUTTER } from '@/theme';

export default function PlanScreen() {
  const { isPro } = usePurchases();
  const usage = useStore((s) => s.usage);
  const month = new Date().toISOString().slice(0, 7);
  const used = usage.month === month ? usage.imports : 0;
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <PlanPicker onContinueFree={isPro ? undefined : closePaywall} freeImportsLeft={Math.max(0, FREE_IMPORTS_PER_MONTH - used)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, paddingTop: 8, paddingBottom: 48 },
});
