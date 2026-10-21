import { PhotoPaywall } from '@/components/PhotoPaywall';
import { closePaywall } from '@/components/PlanPicker';
import { freeImportsLeft } from '@/lib/plans';
import { useStore } from '@/store';

export default function PlanScreen() {
  const usage = useStore((s) => s.usage);
  return <PhotoPaywall onContinueFree={closePaywall} freeImportsLeft={freeImportsLeft(usage)} />;
}
