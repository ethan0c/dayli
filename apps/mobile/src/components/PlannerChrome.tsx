import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SectionTitle } from '@/components/Controls';
import { Icon, type IconKey } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { useTheme } from '@/theme';

export function SectionHeading({ title, detail, action }: {
  title: string;
  detail?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.sectionHeading}>
      <SectionTitle title={title} detail={detail} onPress={action?.onPress} />
    </View>
  );
}

/** A real entry point into capture, including when there is no planner data yet. */
export function CaptureCard({ school = false, compact = false }: { school?: boolean; compact?: boolean }) {
  const { c } = useTheme();
  const open = () => router.push('/capture');
  return (
    <View style={styles.capture}>
      <View style={{ gap: 6 }}>
        <T token={compact ? 'title' : 'display'}>{school ? 'Your semester starts here.' : 'Make room for your week.'}</T>
        <T token="callout" color={c.inkSecondary}>
          {school
            ? 'One syllabus. Your classes, exams, and due dates, all in one place.'
            : 'A syllabus, a shift schedule, or a quick message. Turn what’s coming up into a plan.'}
        </T>
      </View>
      <Button label={school ? 'Add your first syllabus' : 'Add to your plan'} onPress={open} />
      <T token="caption" color={c.inkSecondary}>You review everything before it’s added.</T>
    </View>
  );
}

export function ImportRow({ icon, title, detail }: { icon: IconKey; title: string; detail: string }) {
  const { c } = useTheme();
  return (
    <Press accessibilityRole="button" haptic="tap" onPress={() => router.push('/capture')} scale={0.985} style={[styles.importRow, { borderColor: c.line }]}>
      <View style={styles.importIcon}><Icon name={icon} size={20} color={c.inkPrimary} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <T token="subhead">{title}</T>
        <T token="caption" color={c.inkSecondary}>{detail}</T>
      </View>
      <Icon name="chevronRight" size={16} color={c.inkTertiary} />
    </Press>
  );
}

const styles = StyleSheet.create({
  sectionHeading: { marginBottom: 2 },
  capture: { gap: 16, paddingVertical: 8 },
  importRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 14, minHeight: 64 },
  importIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
});
