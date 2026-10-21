import { fullDate, localParts, typicalTermEnd, type TermSystem } from '@dayli/core';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, StyleSheet } from 'react-native';

import { Group, Row } from '@/components/Settings';
import { feedback } from '@/lib/feedback';
import { REGIONS, deviceRegion, hasQuarters, regionName } from '@/lib/locale';
import { SCREEN_GUTTER } from '@/theme';
import { useStore } from '@/store';

/** Where the person studies: the term calendar Semli guesses from, and how numeric dates read. */
export default function RegionScreen() {
  const { t } = useLingui();
  const systems: { id: TermSystem; label: string }[] = [
    { id: 'semester', label: t`Semesters` },
    { id: 'quarter', label: t`Quarters` },
  ];
  const chosen = useStore((s) => s.settings.region);
  const termSystem = useStore((s) => s.settings.termSystem);
  const setSettings = useStore((s) => s.setSettings);
  const phone = deviceRegion();
  const region = chosen ?? phone;
  const today = localParts(new Date()).date;
  const guess = typicalTermEnd(today, region, hasQuarters(region) ? termSystem : 'semester');
  const term = guess.name;
  const ends = fullDate(guess.date);
  const phoneName = regionName(phone);
  const pick = (patch: { region?: string | null; termSystem?: TermSystem }) => {
    feedback('select');
    setSettings(patch);
  };
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group footer={t`When a syllabus doesn't say when classes end, Semli guesses the ${term}: ${ends}. It also reads dates like 4/11 the way they're written here.`}>
        <Row label={t`Match iPhone, ${phoneName}`} selected={chosen === null} onPress={() => pick({ region: null })} last={false} />
        {REGIONS.filter((r) => r.id !== phone).map((r, i, list) => (
          <Row key={r.id} label={r.name} selected={chosen === r.id} onPress={() => pick({ region: r.id })} last={i === list.length - 1} />
        ))}
      </Group>
      {hasQuarters(region) ? (
        <Group title={t`Your school runs on`}>
          {systems.map((o, i) => (
            <Row key={o.id} label={o.label} selected={termSystem === o.id} onPress={() => pick({ termSystem: o.id })} last={i === systems.length - 1} />
          ))}
        </Group>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ body: { padding: 16, paddingHorizontal: SCREEN_GUTTER, gap: 28 } });
