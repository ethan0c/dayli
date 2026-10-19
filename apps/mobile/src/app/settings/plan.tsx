import { PhotoPaywall } from '@/components/PhotoPaywall';
import { closePaywall } from '@/components/PlanPicker';
import { FREE_IMPORTS_PER_MONTH } from '@/lib/plans';
import { useStore } from '@/store';

export default function PlanScreen() {
  const usage = useStore((s) => s.usage);
  const used = usage.month === new Date().toISOString().slice(0, 7) ? usage.imports : 0;
  return <PhotoPaywall onContinueFree={closePaywall} freeImportsLeft={Math.max(0, FREE_IMPORTS_PER_MONTH - used)} />;
}
