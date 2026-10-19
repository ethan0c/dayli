import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconKey } from '@/components/Icon';
import { Button } from '@/components/Sheet';
import { T } from '@/components/Text';
import { Wordmark } from '@/components/Wordmark';
import { FREE_IMPORTS_PER_MONTH, PLANS, money, perMonth } from '@/lib/plans';
import { useStore, type PlanId } from '@/store';
import { radius, textStyle, useTheme } from '@/theme';

const STEPS = 5;

const WEEK_KINDS: { key: string; label: string; icon: IconKey }[] = [
  { key: 'classes', label: 'Classes', icon: 'school' },
  { key: 'work', label: 'A job', icon: 'work' },
  { key: 'clinicals', label: 'Clinicals', icon: 'heart' },
  { key: 'labs', label: 'Labs', icon: 'exam' },
  { key: 'sports', label: 'Sports', icon: 'calendar' },
  { key: 'chaos', label: 'Pure chaos', icon: 'sparkle' },
];

export default function OnboardingScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const loadSample = useStore((s) => s.loadSample);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name);
  const [kinds, setKinds] = useState<string[]>(settings.weekKinds);
  const [student, setStudent] = useState(settings.isStudent);
  const [plan, setPlan] = useState<PlanId | null>(settings.planIntent);

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.min(s + 1, STEPS - 1));
  };

  const finish = (withSample: boolean) => {
    setSettings({ name: name.trim(), weekKinds: kinds, isStudent: student, planIntent: plan, onboarded: true, seeded: true });
    if (withSample) loadSample();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: c.canvas, paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.progress}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= step ? c.inkPrimary : c.line }]} />
        ))}
      </View>

      {step === 0 && <Welcome onNext={next} />}
      {step === 1 && (
        <WeekStep
          name={name}
          onName={setName}
          kinds={kinds}
          onToggle={(k) => {
            Haptics.selectionAsync();
            setKinds((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));
          }}
          onNext={next}
        />
      )}
      {step === 2 && <DemoStep onNext={next} />}
      {step === 3 && <PriceStep student={student} onStudent={setStudent} plan={plan} onPlan={setPlan} onNext={next} />}
      {step === 4 && <DoneStep name={name.trim()} onSample={() => finish(true)} onEmpty={() => finish(false)} />}
    </View>
  );
}

/* ---------- Step 0: the wordmark assembles itself ---------- */

function Welcome({ onNext }: { onNext: () => void }) {
  const { c } = useTheme();
  const [rise] = useState(() => new Animated.Value(0));
  const [line] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.sequence([
      Animated.spring(rise, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(line, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [rise, line]);
  return (
    <View style={styles.center}>
      <Animated.View
        style={{
          opacity: rise,
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        }}>
        <Wordmark width={220} ink={c.inkPrimary} />
      </Animated.View>
      <Animated.View style={{ opacity: line, transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }], gap: 12, alignItems: 'center' }}>
        <T token="display" style={{ textAlign: 'center' }}>
          The daily planner for college students.
        </T>
        <T token="callout" color={c.inkSecondary} style={{ textAlign: 'center', maxWidth: 300 }}>
          Drop in a syllabus, a work schedule, or a text. Dayli tells you what matters today.
        </T>
      </Animated.View>
      <View style={styles.footer}>
        <Button label="Let's go" onPress={onNext} />
      </View>
    </View>
  );
}

/* ---------- Step 1: what's your week like ---------- */

function WeekStep({
  name,
  onName,
  kinds,
  onToggle,
  onNext,
}: {
  name: string;
  onName: (v: string) => void;
  kinds: string[];
  onToggle: (k: string) => void;
  onNext: () => void;
}) {
  const { c } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <T token="display">First, the basics.</T>
      <T token="overline" color={c.inkSecondary} style={styles.ov}>
        What should Dayli call you?
      </T>
      <TextInput
        value={name}
        onChangeText={onName}
        placeholder="Your first name"
        placeholderTextColor={c.inkTertiary}
        autoCapitalize="words"
        autoCorrect={false}
        style={[styles.input, textStyle('body', c.inkPrimary), { backgroundColor: c.row }]}
      />
      <T token="overline" color={c.inkSecondary} style={styles.ov}>
        {"What's in a typical week?"}
      </T>
      <View style={styles.chips}>
        {WEEK_KINDS.map((k) => {
          const on = kinds.includes(k.key);
          return (
            <Pressable
              key={k.key}
              onPress={() => onToggle(k.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[styles.chip, { backgroundColor: on ? c.inkPrimary : c.row }]}>
              <Icon name={k.icon} size={16} color={on ? c.canvas : c.inkPrimary} />
              <T token="subhead" color={on ? c.canvas : c.inkPrimary}>
                {k.label}
              </T>
            </Pressable>
          );
        })}
      </View>
      {kinds.includes('chaos') ? (
        <T token="callout" color={c.accentInk}>
          {"Respect. That's exactly who this is for."}
        </T>
      ) : null}
      <View style={styles.footer}>
        <Button label="Next" onPress={onNext} />
      </View>
    </ScrollView>
  );
}

/* ---------- Step 2: watch a message turn into a plan ---------- */

const DEMO_TEXT = 'I work Fri 4–10, have a pharm exam Monday at 9, and need to buy scrubs Wednesday';
const DEMO_ROWS: { title: string; kind: 'event' | 'task'; cat: 'work' | 'school' | 'personal'; icon: IconKey; chip?: string }[] = [
  { title: 'Buy scrubs', kind: 'task', cat: 'personal', icon: 'bag' },
  { title: 'Work shift', kind: 'event', cat: 'work', icon: 'work', chip: 'Fri · 4–10 pm' },
  { title: 'Pharm exam', kind: 'event', cat: 'school', icon: 'exam', chip: 'Mon · 9 am' },
];

function DemoStep({ onNext }: { onNext: () => void }) {
  const { c } = useTheme();
  const [typed, setTyped] = useState('');
  const [shown, setShown] = useState(0);
  const [anims] = useState(() => DEMO_ROWS.map(() => new Animated.Value(0)));

  useEffect(() => {
    let i = 0;
    const type = setInterval(() => {
      i += 2;
      setTyped(DEMO_TEXT.slice(0, i));
      if (i >= DEMO_TEXT.length) {
        clearInterval(type);
        DEMO_ROWS.forEach((_, idx) => {
          setTimeout(() => {
            setShown(idx + 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.spring(anims[idx]!, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start();
          }, 450 + idx * 380);
        });
      }
    }, 28);
    return () => clearInterval(type);
  }, [anims]);

  return (
    <View style={styles.page}>
      <T token="display">Just tell it.</T>
      <T token="callout" color={c.inkSecondary}>
        No forms. Type it, say it, or send a screenshot.
      </T>
      <View style={[styles.bubble, { backgroundColor: c.inkPrimary }]}>
        <T color={c.canvas}>{typed}</T>
      </View>
      <View style={{ gap: 8, marginTop: 8 }}>
        {DEMO_ROWS.map((r, i) => {
          const fill = r.kind === 'event' ? c.category[r.cat].fill : c.row;
          const ink = r.kind === 'event' ? c.category[r.cat].ink : c.inkPrimary;
          return (
            <Animated.View
              key={r.title}
              style={[
                styles.row,
                { backgroundColor: fill, opacity: anims[i], transform: [{ translateY: anims[i]!.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
              ]}>
              <Icon name={r.icon} color={ink} />
              <T color={ink} style={{ flex: 1 }}>
                {r.title}
              </T>
              {r.chip ? (
                <View style={[styles.chipTime, { backgroundColor: c.chip }]}>
                  <T token="subhead" color={ink}>
                    {r.chip}
                  </T>
                </View>
              ) : (
                <View style={[styles.circle, { borderColor: c.line, backgroundColor: c.canvas }]} />
              )}
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Button label={shown === DEMO_ROWS.length ? "That's it. No typing." : 'Reading…'} disabled={shown < DEMO_ROWS.length} onPress={onNext} />
      </View>
    </View>
  );
}

/* ---------- Step 3: price, honestly ---------- */

function PriceStep({
  student,
  onStudent,
  plan,
  onPlan,
  onNext,
}: {
  student: boolean;
  onStudent: (v: boolean) => void;
  plan: PlanId | null;
  onPlan: (p: PlanId | null) => void;
  onNext: () => void;
}) {
  const { c } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <T token="display">Free to start.</T>
      <T token="callout" color={c.inkSecondary}>
        {FREE_IMPORTS_PER_MONTH} imports a month, reminders, and the calendar are free forever. Plus reads everything you throw at it.
      </T>

      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onStudent(!student);
        }}
        accessibilityRole="switch"
        accessibilityState={{ checked: student }}
        style={[styles.studentRow, { backgroundColor: student ? c.accentSoft : c.row, borderColor: student ? c.accentBorder : 'transparent' }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <T token="headline">{"I'm a college student"}</T>
          <T token="caption" color={c.inkSecondary}>
            {"We don't check IDs or .edu emails. We trust you. If you're not a student anymore, switch this off and pay the regular price."}
          </T>
        </View>
        <View style={[styles.toggle, { backgroundColor: student ? c.inkPrimary : c.line }]}>
          <View style={[styles.knob, { backgroundColor: c.canvas, alignSelf: student ? 'flex-end' : 'flex-start' }]} />
        </View>
      </Pressable>

      <View style={{ gap: 8 }}>
        {PLANS.map((p) => {
          const on = plan === p.id;
          const price = student ? p.student : p.regular;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                Haptics.selectionAsync();
                onPlan(on ? null : p.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[styles.plan, { backgroundColor: c.row, borderColor: on ? c.inkPrimary : 'transparent' }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <T token="headline">{p.name}</T>
                  {p.tag ? (
                    <View style={[styles.tag, { backgroundColor: c.accentSoft }]}>
                      <T token="caption" color={c.accentInk}>
                        {p.tag}
                      </T>
                    </View>
                  ) : null}
                </View>
                <T token="caption" color={c.inkSecondary}>
                  {perMonth(p, student)}
                  {student ? ` · regular ${money(p.regular)}` : ''}
                </T>
              </View>
              <T token="title" tabular>
                {money(price)}
              </T>
              <T token="caption" color={c.inkSecondary}>
                /{p.period}
              </T>
            </Pressable>
          );
        })}
      </View>
      <T token="caption" color={c.inkSecondary}>
        {"Every plan starts with a 7-day free trial. You'll be asked after your first import, not now."}
      </T>
      <View style={styles.footer}>
        <Button label={plan ? `Start free, then ${PLANS.find((p) => p.id === plan)!.name}` : 'Start free'} onPress={onNext} />
      </View>
    </ScrollView>
  );
}

/* ---------- Step 4: done ---------- */

function DoneStep({ name, onSample, onEmpty }: { name: string; onSample: () => void; onEmpty: () => void }) {
  const { c } = useTheme();
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
  }, [pop]);
  return (
    <View style={styles.center}>
      <Animated.View style={[styles.dot, { backgroundColor: c.accent, transform: [{ scale: pop }] }]} />
      <T token="display" style={{ textAlign: 'center' }}>
        {name ? `You're set, ${name}.` : "You're set."}
      </T>
      <T token="callout" color={c.inkSecondary} style={{ textAlign: 'center', maxWidth: 300 }}>
        Start with a sample week to see how it feels, or go straight to your own.
      </T>
      <View style={styles.footer}>
        <Button label="Show me a sample week" onPress={onSample} />
        <Button variant="ghost" label="Start with my own" onPress={onEmpty} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  progress: { flexDirection: 'row', gap: 6, paddingBottom: 24 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  page: { flexGrow: 1, gap: 14, paddingBottom: 8 },
  footer: { marginTop: 'auto', paddingTop: 24, gap: 8, alignSelf: 'stretch' },
  ov: { paddingTop: 8 },
  input: { height: 52, borderRadius: radius.row, paddingHorizontal: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: radius.pill },
  bubble: { alignSelf: 'flex-end', maxWidth: '88%', padding: 14, borderRadius: 20, borderBottomRightRadius: 6, minHeight: 48, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.row },
  chipTime: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.chip },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, borderWidth: 1 },
  toggle: { width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11 },
  plan: { flexDirection: 'row', alignItems: 'baseline', gap: 6, padding: 14, borderRadius: radius.card, borderWidth: 1.5 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  dot: { width: 56, height: 56, borderRadius: 28 },
});
