import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconKey } from '@/components/Icon';
import { T } from '@/components/Text';
import { feedback } from '@/lib/feedback';
import { useStore } from '@/store';
import { radius, useTheme } from '@/theme';

export function AccountButton() {
  const { c } = useTheme();
  const name = useStore((s) => s.settings.name);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your profile and settings"
      onPress={() => router.push('/settings')}
      hitSlop={6}
      style={({ pressed }) => [styles.account, { backgroundColor: c.row, opacity: pressed ? 0.65 : 1 }]}>
      {name ? <T token="headline">{Array.from(name.trim())[0]}</T> : <Icon name="user" size={19} color={c.inkPrimary} />}
    </Pressable>
  );
}

export function SectionHeading({ title, detail, action }: {
  title: string;
  detail?: string;
  action?: { label: string; onPress: () => void };
}) {
  const { c } = useTheme();
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1, gap: 3 }}>
        <T token="headline" accessibilityRole="header">{title}</T>
        {detail ? <T token="caption" color={c.inkSecondary}>{detail}</T> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.textAction}>
          <T token="subhead" color={c.accentInk}>{action.label}</T>
          <Icon name="chevronRight" size={14} color={c.accentInk} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** A real entry point into capture, including when there is no planner data yet. */
export function CaptureCard({ school = false, compact = false }: { school?: boolean; compact?: boolean }) {
  const { c } = useTheme();
  const open = () => { feedback('tap'); router.push('/capture'); };
  return (
    <View style={[styles.capture, { backgroundColor: c.accentSoft }]}>
      {!compact ? (
        <View style={styles.illustration} accessible={false} importantForAccessibility="no-hide-descendants">
          <View style={[styles.paperBack, { backgroundColor: c.tint.lavender.fill }]} />
          <View style={[styles.paper, { backgroundColor: c.surface }]}>
            <Icon name={school ? 'book' : 'calendar'} size={27} color={c.accentInk} />
            <View style={[styles.paperLine, { backgroundColor: c.accentBorder, width: 40 }]} />
            <View style={[styles.paperLine, { backgroundColor: c.line, width: 28 }]} />
          </View>
          <View style={[styles.paperCheck, { backgroundColor: c.accent }]}>
            <Icon name="tick" size={14} color={c.onAccent} strokeWidth={2.5} />
          </View>
        </View>
      ) : null}
      <View style={{ gap: 8 }}>
        <T token={compact ? 'headline' : 'title'}>{school ? 'Your semester starts here.' : 'Make room for your week.'}</T>
        <T token="callout" color={c.inkSecondary}>
          {school
            ? 'One syllabus. Your classes, exams, and due dates, all in one place.'
            : 'A syllabus, a shift schedule, or a quick message. Turn what’s coming up into a plan.'}
        </T>
      </View>
      <Pressable accessibilityRole="button" onPress={open} style={({ pressed }) => [styles.captureButton, { backgroundColor: c.inkPrimary, opacity: pressed ? 0.8 : 1 }]}>
        <Icon name={school ? 'file' : 'plus'} size={18} color={c.onPrimary} />
        <T token="subhead" color={c.onPrimary}>{school ? 'Add your first syllabus' : 'Add to your plan'}</T>
        <View style={{ flex: 1 }} />
        <Icon name="chevronRight" size={16} color={c.onPrimary} />
      </Pressable>
      <View style={styles.reassurance}>
        <Icon name="check" size={14} color={c.inkSecondary} />
        <T token="caption" color={c.inkSecondary}>You review everything before it’s added.</T>
      </View>
    </View>
  );
}

export function ImportRow({ icon, title, detail }: { icon: IconKey; title: string; detail: string }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/capture')} style={({ pressed }) => [styles.importRow, { borderColor: c.line, opacity: pressed ? 0.65 : 1 }]}>
      <View style={[styles.importIcon, { backgroundColor: c.row }]}><Icon name={icon} size={20} color={c.inkSecondary} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <T token="subhead">{title}</T>
        <T token="caption" color={c.inkSecondary}>{detail}</T>
      </View>
      <Icon name="chevronRight" size={16} color={c.inkTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  account: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  textAction: { minHeight: 44, flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center' },
  capture: { borderRadius: radius.card, padding: 22, gap: 18 },
  illustration: { width: 100, height: 100, alignSelf: 'center', marginVertical: 4 },
  paperBack: { position: 'absolute', width: 64, height: 78, top: 5, left: 8, borderRadius: 13, transform: [{ rotate: '-12deg' }] },
  paper: { position: 'absolute', width: 66, height: 80, top: 10, left: 24, borderRadius: 13, padding: 12, gap: 7, transform: [{ rotate: '6deg' }] },
  paperLine: { height: 3, borderRadius: 2 },
  paperCheck: { position: 'absolute', width: 26, height: 26, borderRadius: 13, right: 0, bottom: 6, alignItems: 'center', justifyContent: 'center' },
  captureButton: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.row, flexDirection: 'row', alignItems: 'center', gap: 10 },
  reassurance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  importRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 14, minHeight: 72 },
  importIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
