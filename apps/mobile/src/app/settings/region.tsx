import { fullDate, localParts, typicalTermEnd, type TermSystem } from '@dayli/core';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, StyleSheet } from 'react-native';

import { Group, Row } from '@/components/Settings';
import { feedback } from '@/lib/feedback';
import { REGIONS, deviceRegion, hasQuarters, regionName } from '@/lib/locale';
import { SYSTEM_NAME } from '@/lib/web';
import { screen } from '@/theme';
import { useStore } from '@/store';

/** Where the person studies: the term calendar Semli guesses from, and how numeric dates read. */
export default function RegionScreen() {
  const { t, i18n } = useLingui();
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
  const ends = fullDate(guess.date);
  const phoneName = regionName(phone, i18n.locale);
  const pick = (patch: { region?: string | null; termSystem?: TermSystem }) => {
    feedback('select');
    setSettings(patch);
  };
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group footer={t`When a syllabus doesn't list an end date, Semli suggests ${ends} for classes in this region. Numeric dates, such as 4/11, follow this region's conventions.`}>
        <Row label={SYSTEM_NAME === 'system' ? t`Match system, ${phoneName}` : t`Match iPhone, ${phoneName}`} selected={chosen === null} onPress={() => pick({ region: null })} last={false} />
        {REGIONS.filter((r) => r.id !== phone).map((r, i, list) => (
          <Row key={r.id} label={regionName(r.id, i18n.locale)} selected={chosen === r.id} onPress={() => pick({ region: r.id })} last={i === list.length - 1} />
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

const styles = StyleSheet.create({ body: screen.settingsBody });
