import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { PlanPicker } from "@/components/PlanPicker";
import { Button } from "@/components/Sheet";
import { T } from "@/components/Text";
import { Wordmark } from "@/components/Wordmark";
import { track } from "@/lib/analytics";
import { feedback } from "@/lib/feedback";
import { MAJORS, chipsFor, profileFor, type Profile, type Role } from "@/lib/majors";
import { FREE_IMPORTS_PER_MONTH } from "@/lib/plans";
import { useStore } from "@/store";
import { SCREEN_GUTTER, radius, textStyle, useTheme } from "@/theme";

const STEPS = 5;

const ROLES: { id: Role; label: string }[] = [
  { id: "student", label: "Student" },
  { id: "both", label: "Student with a job" },
  { id: "working", label: "Working" },
];

export default function OnboardingScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const loadSample = useStore((s) => s.loadSample);
  // `?step=3` opens a specific step; useful when previewing copy and layout.
  const params = useLocalSearchParams<{ step?: string }>();
  const requested = Math.min(Math.max(Number(params.step) || 0, 0), STEPS - 1);
  const [step, setStep] = useState(requested);
  // Reset when the link changes (derived state, the React-sanctioned way, no effect).
  const [lastRequested, setLastRequested] = useState(requested);
  if (lastRequested !== requested) {
    setLastRequested(requested);
    setStep(requested);
  }
  const [name, setName] = useState(settings.name);
  const [role, setRole] = useState<Role>(settings.isStudent ? "both" : "working");
  const [major, setMajor] = useState<string | null>(settings.major);
  const [kinds, setKinds] = useState<string[]>(settings.weekKinds);

  const student = role !== "working";
  const profile = profileFor(major, student);

  const next = () => {
    feedback("tap");
    setStep((s) => Math.min(s + 1, STEPS - 1));
  };

  const finish = (withSample: boolean) => {
    setSettings({
      name: name.trim(),
      weekKinds: kinds,
      isStudent: student,
      major: student ? (major ?? "other") : null,
      onboarded: true,
      seeded: true,
    });
    track("onboarding_completed", { role, major: student ? (major ?? "other") : null, sample: withSample });
    if (withSample) loadSample();
    feedback("success");
    router.replace("/");
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: c.canvas,
          paddingTop: insets.top + 12,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.progress}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= step ? c.inkPrimary : c.line },
            ]}
          />
        ))}
      </View>

      {step === 0 && <Welcome onNext={next} />}
      {step === 1 && (
        <AboutYouStep
          name={name}
          onName={setName}
          role={role}
          onRole={(r) => {
            feedback("select");
            setRole(r);
            if (r === "working") setKinds((ks) => ks.filter((k) => k !== "classes"));
          }}
          major={major}
          onMajor={(m) => {
            feedback("select");
            setMajor(m);
          }}
          profile={profile}
          kinds={kinds}
          onToggle={(k) => {
            feedback("select");
            setKinds((ks) =>
              ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k],
            );
          }}
          onNext={next}
        />
      )}
      {step === 2 && <DemoStep key={profile.id} profile={profile} onNext={next} />}
      {step === 3 && (
        <PriceStep onNext={next} />
      )}
      {step === 4 && (
        <DoneStep
          name={name.trim()}
          student={student}
          onSample={() => finish(true)}
          onEmpty={() => finish(false)}
        />
      )}
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
      Animated.spring(rise, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(line, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [rise, line]);
  return (
    <View style={styles.center}>
      <View style={styles.middle}>
        <Animated.View
          style={{
            opacity: rise,
            transform: [
              {
                translateY: rise.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
              {
                scale: rise.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          }}
        >
          <Wordmark width={220} ink={c.inkPrimary} />
        </Animated.View>
        <Animated.View
          style={{
            opacity: line,
            transform: [
              {
                translateY: line.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
            gap: 12,
            alignItems: "center",
          }}
        >
          <T token="display" style={{ textAlign: "center" }}>
            The daily planner for college students.
          </T>
          <T
            token="callout"
            color={c.inkSecondary}
            style={{ textAlign: "center", maxWidth: 300 }}
          >
            Drop in a syllabus, a work schedule, or a text. Semli tells you what
            matters today.
          </T>
        </Animated.View>
      </View>
      <View style={styles.footer}>
        <Button label="Let's go" onPress={onNext} />
      </View>
    </View>
  );
}

/* ---------- Step 1: about you ---------- */

function Chip({
  label,
  icon,
  on,
  onPress,
  role = "checkbox",
}: {
  label: string;
  icon?: Profile["icon"];
  on: boolean;
  onPress: () => void;
  role?: "checkbox" | "radio";
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={role === "radio" ? { selected: on } : { checked: on }}
      style={[styles.chip, { backgroundColor: on ? c.inkPrimary : c.row }]}
    >
      {icon ? <Icon name={icon} size={16} color={on ? c.canvas : c.inkPrimary} /> : null}
      <T token="subhead" color={on ? c.canvas : c.inkPrimary}>
        {label}
      </T>
    </Pressable>
  );
}

function AboutYouStep({
  name,
  onName,
  role,
  onRole,
  major,
  onMajor,
  profile,
  kinds,
  onToggle,
  onNext,
}: {
  name: string;
  onName: (v: string) => void;
  role: Role;
  onRole: (r: Role) => void;
  major: string | null;
  onMajor: (m: string) => void;
  profile: Profile;
  kinds: string[];
  onToggle: (k: string) => void;
  onNext: () => void;
}) {
  const { c } = useTheme();
  const student = role !== "working";
  const chips = chipsFor(profile, student);
  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <T token="display">First, the basics.</T>
      <T token="overline" color={c.inkSecondary} style={styles.ov}>
        What should Semli call you?
      </T>
      <TextInput
        value={name}
        onChangeText={onName}
        placeholder="Your first name"
        placeholderTextColor={c.inkTertiary}
        autoCapitalize="words"
        autoCorrect={false}
        style={[
          styles.input,
          textStyle("body", c.inkPrimary),
          { backgroundColor: c.row },
        ]}
      />

      <T token="overline" color={c.inkSecondary} style={styles.ov}>
        Right now you are a
      </T>
      <View style={styles.chips}>
        {ROLES.map((r) => (
          <Chip key={r.id} label={r.label} on={role === r.id} onPress={() => onRole(r.id)} role="radio" />
        ))}
      </View>

      {student ? (
        <>
          <T token="overline" color={c.inkSecondary} style={styles.ov}>
            What are you studying?
          </T>
          <View style={styles.chips}>
            {MAJORS.map((m) => (
              <Chip key={m.id} label={m.label} icon={m.icon} on={major === m.id} onPress={() => onMajor(m.id)} role="radio" />
            ))}
          </View>
        </>
      ) : null}

      <T token="overline" color={c.inkSecondary} style={styles.ov}>
        {"What's in a typical week?"}
      </T>
      <View style={styles.chips}>
        {chips.map((k) => (
          <Chip key={k.key} label={k.label} icon={k.icon} on={kinds.includes(k.key)} onPress={() => onToggle(k.key)} />
        ))}
      </View>
      {kinds.includes("chaos") ? (
        <T token="callout" color={c.accentInk}>
          {"A busy week is a good place to start. Semli can help you keep track."}
        </T>
      ) : null}
      <View style={styles.footer}>
        <Button label="Next" onPress={onNext} />
      </View>
    </ScrollView>
  );
}

/* ---------- Step 2: watch a message turn into a plan ---------- */

function DemoStep({ profile, onNext }: { profile: Profile; onNext: () => void }) {
  const { c } = useTheme();
  const { text, rows } = profile.demo;
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(0);
  const [anims] = useState(() => rows.map(() => new Animated.Value(0)));

  useEffect(() => {
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const type = setInterval(() => {
      i += 2;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(type);
        rows.forEach((_, idx) => {
          timers.push(
            setTimeout(
              () => {
                setShown(idx + 1);
                feedback("select");
                Animated.spring(anims[idx]!, {
                  toValue: 1,
                  friction: 6,
                  tension: 60,
                  useNativeDriver: true,
                }).start();
              },
              450 + idx * 380,
            ),
          );
        });
      }
    }, 28);
    return () => {
      clearInterval(type);
      timers.forEach(clearTimeout);
    };
  }, [anims, rows, text]);

  return (
    <View style={styles.page}>
      <T token="display">Just tell it.</T>
      <T token="callout" color={c.inkSecondary}>
        Type what’s coming up, or send a screenshot. Semli finds the dates for you.
      </T>
      <View style={[styles.bubble, { backgroundColor: c.inkPrimary }]}>
        <T color={c.canvas}>{typed}</T>
      </View>
      <View style={{ gap: 8, marginTop: 8 }}>
        {rows.map((r, i) => {
          const fill = r.kind === "event" ? c.category[r.cat].fill : c.row;
          const ink = r.kind === "event" ? c.category[r.cat].ink : c.inkPrimary;
          return (
            <Animated.View
              key={r.title}
              style={[
                styles.row,
                {
                  backgroundColor: fill,
                  opacity: anims[i],
                  transform: [
                    {
                      translateY: anims[i]!.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
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
                <View
                  style={[
                    styles.circle,
                    { borderColor: c.line, backgroundColor: c.canvas },
                  ]}
                />
              )}
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Button
          label={shown === rows.length ? "Continue" : "Reading…"}
          disabled={shown < rows.length}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

/* ---------- Step 3: price, honestly ---------- */

function PriceStep({ onNext }: { onNext: () => void }) {
  const { c } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <T token="display">Free to start.</T>
      <T token="callout" color={c.inkSecondary}>
        {FREE_IMPORTS_PER_MONTH} imports a month, reminders, and the calendar are free forever. Semli Plus adds unlimited imports.
      </T>
      <PlanPicker />
      <T token="caption" color={c.inkSecondary}>
        {"Choose a plan to see its price and any eligible offers, or continue for free."}
      </T>
      <View style={styles.footer}>
        <Button label="Continue" onPress={onNext} />
      </View>
    </ScrollView>
  );
}

/* ---------- Step 4: done ---------- */

function DoneStep({
  name,
  student,
  onSample,
  onEmpty,
}: {
  name: string;
  student: boolean;
  onSample: () => void;
  onEmpty: () => void;
}) {
  const { c } = useTheme();
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [pop]);
  return (
    <View style={styles.center}>
      <View style={styles.middle}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: c.accent, transform: [{ scale: pop }] },
          ]}
        />
        <T token="display" style={{ textAlign: "center" }}>
          {name ? `You're set, ${name}.` : "You're set."}
        </T>
        <T
          token="callout"
          color={c.inkSecondary}
          style={{ textAlign: "center", maxWidth: 300 }}
        >
          {student
            ? "Start with a sample week in your field to see how it feels, or go straight to your own."
            : "Start with a sample week to see how it feels, or go straight to your own."}
        </T>
      </View>
      <View style={styles.footer}>
        <Button label="Show me a sample week" onPress={onSample} />
        <Button variant="ghost" label="Start with my own" onPress={onEmpty} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SCREEN_GUTTER },
  progress: { flexDirection: "row", gap: 6, paddingBottom: 24 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  center: { flex: 1 },
  middle: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  page: { flexGrow: 1, gap: 14, paddingBottom: 8 },
  footer: { marginTop: "auto", paddingTop: 24, gap: 8, alignSelf: "stretch" },
  ov: { paddingTop: 8 },
  input: { height: 52, borderRadius: radius.row, paddingHorizontal: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: radius.pill,
  },
  bubble: {
    alignSelf: "flex-end",
    maxWidth: "88%",
    padding: 14,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    minHeight: 48,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: radius.row,
  },
  chipTime: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.chip,
  },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  dot: { width: 56, height: 56, borderRadius: 28 },
});
