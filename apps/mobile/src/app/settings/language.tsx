import { useLingui } from '@lingui/react/macro';
import { ScrollView, StyleSheet } from 'react-native';

import { Group, Row } from '@/components/Settings';
import { feedback } from '@/lib/feedback';
import { LANGUAGES, type AppLanguage } from '@/lib/language';
import { SYSTEM_NAME } from '@/lib/web';
import { useStore } from '@/store';
import { screen } from '@/theme';

export default function LanguageScreen() {
  const { t } = useLingui();
  const language = useStore((s) => s.settings.language);
  const setSettings = useStore((s) => s.setSettings);
  const pick = (language: AppLanguage | null) => {
    feedback('select');
    setSettings({ language });
  };
  return (
    <ScrollView contentContainerStyle={styles.body} contentInsetAdjustmentBehavior="automatic">
      <Group footer={t`Choose the language for Semli. Your region, dates, and school calendar stay the same. Spanish currently covers navigation and profile preferences; other screens are still in English.`}>
        <Row label={(SYSTEM_NAME === 'system' ? t`Match system` : t`Match iPhone`)} selected={language == null} onPress={() => pick(null)} />
        {LANGUAGES.map((l, i) => (
          <Row key={l.id} label={l.name} selected={language === l.id} onPress={() => pick(l.id)} last={i === LANGUAGES.length - 1} />
        ))}
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ body: screen.settingsBody });
