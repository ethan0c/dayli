import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconKey } from "@/components/Icon";
import { Press } from "@/components/Press";
import { PlanPicker } from "@/components/PlanPicker";
import { Reading } from "@/components/Reading";
import { Button } from "@/components/Sheet";
import { T } from "@/components/Text";
import { Wordmark } from "@/components/Wordmark";
import { track } from "@/lib/analytics";
import { requestExtraction } from "@/lib/api";
import { InputError, extractionContext, pickImageInput, pickPdfInput } from "@/lib/capture-input";
import { feedback } from "@/lib/feedback";
import { enter } from "@/lib/motion";
import { MAJORS, chipsFor, profileFor, type Profile, type Role } from "@/lib/majors";
import { requestNotifications, syncReminders } from "@/lib/notifications";
import { FREE_IMPORTS_PER_MONTH } from "@/lib/plans";
import { useStore } from "@/store";
import { SCREEN_GUTTER, radius, textStyle, useTheme } from "@/theme";

/**
 * One real result before any ask. The order follows docs/onboarding-research.md §3:
 * three one-tap questions → the demo → your own import → the review sheet (the aha)
 * → reminders priming → the paywall after value → Today.
 */
const STEPS = ["welcome", "role", "major", "week", "demo", "own", "heads-up", "plus"] as const;
type Step = (typeof STEPS)[number];

type Picked = { input: Parameters<typeof requestExtraction>[1]["input"]; source: string } | null;

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "student", label: "Student", hint: "Classes, exams, deadlines" },
  { id: "both", label: "Student with a job", hint: "Classes plus shifts that change" },
  { id: "working", label: "Working", hint: "Shifts, appointments, life" },
];

export default function OnboardingScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const showToast = useStore((s) => s.showToast);
  const importDone = useStore((s) => s.settings.onboardingImportDone);

  // `?step=plus` opens a specific step; useful when previewing copy and layout.
  const params = useLocalSearchParams<{ step?: string }>();
  const requested = (STEPS as readonly string[]).includes(params.step ?? "") ? (params.step as Step) : "welcome";
  const [step, setStep] = useState<Step>(requested);
  // Reset when the link changes (derived state, no effect).
  const [lastRequested, setLastRequested] = useState(requested);
  if (lastRequested !== requested) {
    setLastRequested(requested);
    setStep(requested);
  }

  const [name, setName] = useState(settings.name);
  const [role, setRole] = useState<Role>(settings.isStudent ? "both" : "working");
  const [major, setMajor] = useState<string | null>(settings.major);
  const [kinds, setKinds] = useState<string[]>(settings.weekKinds);
  const [usedSample, setUsedSample] = useState(false);
  const student = role !== "working";
  const profile = profileFor(major, student);

  const go = (next: Step) => {
    feedback("tap");
    track("onboarding_step", { step: next });
    setStep(next);
  };

  // The review sheet flips this when the first import is confirmed; carry on to the heads-up.
  const [seenImportDone, setSeenImportDone] = useState(importDone);
  if (importDone !== seenImportDone) {
    setSeenImportDone(importDone);
    if (importDone && step === "own") setStep("heads-up");
  }

  const saveProfile = () =>
    setSettings({ name: name.trim(), weekKinds: kinds, isStudent: student, major: student ? (major ?? "other") : null });

  const finish = () => {
    setSettings({ onboarded: true, seeded: true, onboardingImportDone: false });
    track("onboarding_completed", { role, major: student ? (major ?? "other") : null, sample: usedSample });
    feedback("success");
    showToast(usedSample ? "Your preview is ready. Add your own details any time." : "You're set.");
    router.replace("/");
  };

  const progress = STEPS.indexOf(step);

  return (
    <View style={[styles.root, { backgroundColor: c.canvas, paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.bar, { backgroundColor: i <= progress ? c.inkPrimary : c.line }]} />
        ))}
      </View>

      <Animated.View key={step} entering={enter.fromRight} style={{ flex: 1 }}>
      {step === "welcome" && <Welcome onNext={() => go("role")} />}
      {step === "role" && (
        <OneTapStep title="Right now you are a" subtitle="So the examples fit your week.">
          {ROLES.map((r) => (
            <Choice
              key={r.id}
              label={r.label}
              hint={r.hint}
              on={role === r.id}
              onPress={() => {
                setRole(r.id);
                if (r.id === "working") setKinds((ks) => ks.filter((k) => k !== "classes"));
                go(r.id === "working" ? "week" : "major");
              }}
            />
          ))}
        </OneTapStep>
      )}
      {step === "major" && (
        <OneTapStep title="What are you studying?" subtitle="Pick the closest. You can change it later in You.">
          {MAJORS.map((m) => (
            <Choice
              key={m.id}
              label={m.label}
              icon={m.icon}
              on={major === m.id}
              onPress={() => {
                setMajor(m.id);
                go("week");
              }}
            />
          ))}
        </OneTapStep>
      )}
      {step === "week" && (
        <WeekStep
          name={name}
          onName={setName}
          profile={profile}
          student={student}
          kinds={kinds}
          onToggle={(k) => {
            feedback("select");
            setKinds((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));
          }}
          onNext={() => {
            saveProfile();
            go("demo");
          }}
        />
      )}
      {step === "demo" && <DemoStep key={profile.id} profile={profile} onNext={() => go("own")} />}
      {step === "own" && (
        <OwnStep
          onSample={() => {
            saveProfile();
            setUsedSample(true);
            // Reminders are asked later, after their first real import.
            go("plus");
          }}
        />
      )}
      {step === "heads-up" && <HeadsUpStep onDone={() => go("plus")} />}
      {step === "plus" && <PlusStep onFinish={finish} />}
      </Animated.View>
    </View>
  );
}

/* ---------- Welcome: the wordmark assembles itself ---------- */

function Welcome({ onNext }: { onNext: () => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.center}>
      <View style={styles.middle}>
        <Animated.View entering={enter.rise}>
          <Wordmark width={220} ink={c.inkPrimary} />
        </Animated.View>
        <Animated.View entering={enter.rise.delay(350)} style={{ gap: 12, alignItems: "center" }}>
          <T token="display" style={{ textAlign: "center" }}>
            The daily planner for college students.
          </T>
          <T token="callout" color={c.inkSecondary} style={{ textAlign: "center", maxWidth: 300 }}>
            Drop in a syllabus, a work schedule, or a text. Semli tells you what matters today.
          </T>
          <T token="caption" color={c.inkTertiary} style={{ textAlign: "center" }}>
            Takes a minute. No account.
          </T>
        </Animated.View>
      </View>
      <Animated.View entering={enter.fade.delay(600)} style={styles.footer}>
        <Button label="Let's go" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

/* ---------- One question per screen, auto-advance ---------- */

function OneTapStep({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <T token="display">{title}</T>
      <T token="callout" color={c.inkSecondary}>
        {subtitle}
      </T>
      <View style={{ gap: 8, marginTop: 8 }}>{children}</View>
    </ScrollView>
  );
}

function Choice({ label, hint, icon, on, onPress }: { label: string; hint?: string; icon?: IconKey; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Press
      haptic="select"
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      scale={0.98}
      style={[styles.choice, { backgroundColor: on ? c.inkPrimary : c.row }]}
    >
      {icon ? <Icon name={icon} size={18} color={on ? c.canvas : c.inkPrimary} /> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <T token="headline" color={on ? c.canvas : c.inkPrimary}>
          {label}
        </T>
        {hint ? (
          <T token="caption" color={on ? c.canvas : c.inkSecondary}>
            {hint}
          </T>
        ) : null}
      </View>
      <Icon name="chevronRight" size={16} color={on ? c.canvas : c.inkTertiary} />
    </Press>
  );
}

/* ---------- Your week + optional name ---------- */

function WeekStep({
  name,
  onName,
  profile,
  student,
  kinds,
  onToggle,
  onNext,
}: {
  name: string;
  onName: (v: string) => void;
  profile: Profile;
  student: boolean;
  kinds: string[];
  onToggle: (k: string) => void;
  onNext: () => void;
}) {
  const { c } = useTheme();
  const chips = chipsFor(profile, student);
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <T token="display">{"What's in a typical week?"}</T>
      <T token="callout" color={c.inkSecondary}>
        Tap everything that applies.
      </T>
      <View style={styles.chips}>
        {chips.map((k) => {
          const on = kinds.includes(k.key);
          return (
            <Pressable
              key={k.key}
              onPress={() => onToggle(k.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[styles.chip, { backgroundColor: on ? c.inkPrimary : c.row }]}
            >
              <Icon name={k.icon} size={16} color={on ? c.canvas : c.inkPrimary} />
              <T token="subhead" color={on ? c.canvas : c.inkPrimary}>
                {k.label}
              </T>
            </Pressable>
          );
        })}
      </View>
      {kinds.includes("chaos") ? (
        <T token="callout" color={c.accentInk}>
          {"A busy week is a good place to start. Semli can help you keep track."}
        </T>
      ) : null}
      <T token="overline" color={c.inkSecondary} style={styles.ov}>
        What should Semli call you? Optional.
      </T>
      <TextInput
        value={name}
        onChangeText={onName}
        placeholder="Your first name"
        placeholderTextColor={c.inkTertiary}
        autoCapitalize="words"
        autoCorrect={false}
        style={[styles.input, textStyle("body", c.inkPrimary), { backgroundColor: c.row }]}
      />
      <View style={styles.footer}>
        <Button label="Next" onPress={onNext} />
      </View>
    </ScrollView>
  );
}

/* ---------- Watch it work ---------- */

function DemoStep({ profile, onNext }: { profile: Profile; onNext: () => void }) {
  const { c } = useTheme();
  const { text, rows } = profile.demo;
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(0);

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
            setTimeout(() => {
              setShown(idx + 1);
              feedback("select");
            }, 450 + idx * 380),
          );
        });
      }
    }, 28);
    return () => {
      clearInterval(type);
      timers.forEach(clearTimeout);
    };
  }, [rows, text]);

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
        {rows.slice(0, shown).map((r) => {
          const fill = r.kind === "event" ? c.category[r.cat].fill : c.row;
          const ink = r.kind === "event" ? c.category[r.cat].ink : c.inkPrimary;
          return (
            <Animated.View key={r.title} entering={enter.rise} style={[styles.row, { backgroundColor: fill }]}>
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
        <Button label={shown === rows.length ? "Now try yours" : "Reading…"} disabled={shown < rows.length} onPress={onNext} />
      </View>
    </View>
  );
}

/* ---------- Bring your own, or continue to a personalized display-only preview ---------- */

function OwnStep({ onSample }: { onSample: () => void }) {
  const { c } = useTheme();
  const apiUrl = useStore((s) => s.settings.apiUrl);
  const setPending = useStore((s) => s.setPending);
  const recordImport = useStore((s) => s.recordImport);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(input: NonNullable<Picked>["input"], source: string) {
    setError(null);
    setBusy(source);
    track("import_started", { kind: input.kind, where: "onboarding" });
    try {
      const res = await requestExtraction(apiUrl, { input, context: extractionContext() });
      if (!res.ok) {
        track("import_failed", { kind: input.kind, where: "onboarding" });
        setError(res.error);
        return;
      }
      if (res.extraction.items.length === 0) {
        setError("Semli didn't find anything with a date in that. Try adding when it happens, or explore your preview for now.");
        return;
      }
      feedback("ready");
      recordImport();
      track("import_succeeded", { kind: input.kind, items: res.extraction.items.length, type: res.extraction.detected_type, where: "onboarding" });
      setPending({ extraction: res.extraction, source });
      router.push("/review");
    } catch {
      track("import_failed", { kind: input.kind, where: "onboarding" });
      setError("Semli couldn't read that right now. You can explore your preview and try yours later.");
    } finally {
      setBusy(null);
    }
  }

  const pick = async (fn: () => Promise<Picked>) => {
    setError(null);
    try {
      const picked = await fn();
      if (picked) await run(picked.input, picked.source);
    } catch (e) {
      setError(e instanceof InputError ? e.message : "Semli couldn't open that. Try another file, or type it instead.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <T token="display">Now, your week.</T>
      <T token="callout" color={c.inkSecondary}>
        Paste what’s coming up, or add a screenshot of your schedule. You check what Semli finds before anything is saved.
      </T>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        editable={!busy}
        placeholder="I work Friday 4–10, have an exam Monday, and need to return a library book Wednesday…"
        placeholderTextColor={c.inkTertiary}
        style={[styles.textarea, textStyle("body", c.inkPrimary), { backgroundColor: c.row }]}
      />
      <View style={styles.actions}>
        <Action icon="image" label="Screenshot" disabled={!!busy} onPress={() => void pick(() => pickImageInput(false))} />
        <Action icon="camera" label="Camera" disabled={!!busy} onPress={() => void pick(() => pickImageInput(true))} />
        <Action icon="file" label="Syllabus PDF" disabled={!!busy} onPress={() => void pick(pickPdfInput)} />
      </View>
      {busy ? <Reading source={busy === "Message" ? "your message" : busy} /> : null}
      {error ? (
        <View style={[styles.status, { backgroundColor: c.tint.rose.fill }]}>
          <Icon name="alert" size={16} color={c.tint.rose.ink} />
          <T token="subhead" color={c.tint.rose.ink} style={{ flex: 1 }}>
            {error}
          </T>
        </View>
      ) : null}
      <View style={styles.footer}>
        <Button
          label="See what Semli finds"
          disabled={text.trim().length === 0 || !!busy}
          onPress={() => void run({ kind: "text", text: text.trim() }, "Message")}
        />
        <Button variant="ghost" label="Explore my preview first" disabled={!!busy} onPress={onSample} />
      </View>
    </ScrollView>
  );
}

function Action({ icon, label, onPress, disabled }: { icon: IconKey; label: string; onPress: () => void; disabled: boolean }) {
  const { c } = useTheme();
  return (
    <Press onPress={onPress} disabled={disabled} haptic="tap" accessibilityRole="button" style={[styles.action, { backgroundColor: c.row, opacity: disabled ? 0.5 : 1 }]}>
      <Icon name={icon} size={20} color={c.inkPrimary} />
      <T token="subhead">{label}</T>
    </Press>
  );
}

/* ---------- Heads-up: our sheet first, the system prompt only on yes ---------- */

function HeadsUpStep({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const setSettings = useStore((s) => s.setSettings);
  const [asking, setAsking] = useState(false);
  const yes = async () => {
    setAsking(true);
    setSettings({ remindersAsked: true });
    const ok = await requestNotifications().catch(() => false);
    track("onboarding_step", { step: ok ? "heads-up-yes" : "heads-up-denied" });
    if (ok) {
      setSettings({ reminders: { ...useStore.getState().settings.reminders, enabled: true, briefing: true } });
      await syncReminders().catch(() => {});
    }
    setAsking(false);
    onDone();
  };
  const notNow = () => {
    setSettings({ remindersAsked: true });
    track("onboarding_step", { step: "heads-up-no" });
    onDone();
  };
  return (
    <View style={styles.center}>
      <View style={styles.middle}>
        <Animated.View entering={enter.rise} style={[styles.bigIcon, { backgroundColor: c.tint.butter.fill }]}>
          <Icon name="bell" size={30} color={c.tint.butter.ink} />
        </Animated.View>
        <T token="display" style={{ textAlign: "center" }}>
          Want a heads-up?
        </T>
        <T token="callout" color={c.inkSecondary} style={{ textAlign: "center", maxWidth: 320 }}>
          A reminder before shifts and deadlines, and a short note each morning with what’s on. Nothing else, and never at night.
        </T>
      </View>
      <View style={styles.footer}>
        <Button label={asking ? "One sec…" : "Yes, remind me"} disabled={asking} onPress={() => void yes()} />
        <Button variant="ghost" label="Not now" disabled={asking} onPress={notNow} />
      </View>
    </View>
  );
}

/* ---------- Plus, after the value moment ---------- */

function PlusStep({ onFinish }: { onFinish: () => void }) {
  const { c } = useTheme();
  const trialStarted = useStore((s) => !!s.settings.trial);
  useEffect(() => {
    track("paywall_shown", { reason: "onboarding" });
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <T token="display">Keep it reading.</T>
      <T token="callout" color={c.inkSecondary}>
        Your calendar, to-dos, and reminders are free forever. Plus reads every syllabus and schedule you send it, with a free week to try it.
      </T>
      <PlanPicker />
      <View style={styles.footer}>
        <Button
          variant={trialStarted ? "primary" : "ghost"}
          label={trialStarted ? "Continue" : `Continue free · ${FREE_IMPORTS_PER_MONTH} imports a month`}
          onPress={onFinish}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SCREEN_GUTTER },
  progress: { flexDirection: "row", gap: 5, paddingBottom: 24 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  center: { flex: 1 },
  middle: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  page: { flexGrow: 1, gap: 14, paddingBottom: 8 },
  footer: { marginTop: "auto", paddingTop: 24, gap: 8, alignSelf: "stretch" },
  ov: { paddingTop: 8 },
  input: { height: 52, borderRadius: radius.row, paddingHorizontal: 16 },
  textarea: { minHeight: 120, maxHeight: 200, borderRadius: radius.card, padding: 16, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 8 },
  action: { flex: 1, height: 64, borderRadius: radius.row, alignItems: "center", justifyContent: "center", gap: 4 },
  status: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.row },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 40, borderRadius: radius.pill },
  choice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.card },
  bubble: { alignSelf: "flex-end", maxWidth: "88%", padding: 14, borderRadius: 20, borderBottomRightRadius: 6, minHeight: 48, marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.row },
  chipTime: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.chip },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  bigIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
});
