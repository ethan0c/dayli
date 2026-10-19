import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip, Tile } from "@/components/Controls";
import { Press } from "@/components/Press";
import { Icon, type IconKey } from "@/components/Icon";
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
import { useStore } from "@/store";
import { palettes } from "@dayli/tokens";

import { SCREEN_GUTTER, textStyle, useTheme } from "@/theme";

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
  // Watch it work and the heads-up are showcase pages: dark, ready for a full-bleed photo.
  const showcase = step === "demo" || step === "heads-up";
  const bg = showcase ? palettes.dark.canvas : c.canvas;
  const barOn = showcase ? palettes.dark.inkPrimary : c.inkPrimary;
  const barOff = showcase ? palettes.dark.line : c.line;

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.bar, { backgroundColor: i <= progress ? barOn : barOff }]} />
        ))}
      </View>

      <Animated.View key={step} entering={enter.fromRight} style={{ flex: 1 }}>
      {step === "welcome" && <Welcome onNext={() => go("role")} />}
      {step === "role" && (
        <OneTapStep title="Right now you are a" subtitle="So the examples fit your week. One tap." gap={28}>
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
          <Wordmark width={192} ink={c.inkPrimary} dot={c.accent} />
        </Animated.View>
        <Animated.View entering={enter.rise.delay(350)} style={{ gap: 10, alignItems: "center" }}>
          <T style={[styles.h1, { textAlign: "center", maxWidth: 300 }]}>The daily planner for college students.</T>
          <T token="callout" color={c.inkSecondary} style={{ textAlign: "center", maxWidth: 290 }}>
            Drop in a syllabus, a work schedule, or a text. Semli tells you what matters today.
          </T>
          <T token="caption" color={c.inkSecondary} style={{ textAlign: "center" }}>
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

function OneTapStep({ title, subtitle, children, gap = 24 }: { title: string; subtitle: string; children: React.ReactNode; gap?: number }) {
  const { c } = useTheme();
  return (
    <ScrollView contentContainerStyle={[styles.page, { gap }]}>
      <View style={styles.titleBlock}>
        <T style={styles.h1}>{title}</T>
        <T token="callout" color={c.inkSecondary}>{subtitle}</T>
      </View>
      <View>{children}</View>
    </ScrollView>
  );
}

function Choice({ label, hint, icon, on, onPress }: { label: string; hint?: string; icon?: IconKey; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Press
      haptic="select"
      scale={1}
      accessibilityRole="button"
      accessibilityLabel={on ? `${label}, selected` : label}
      onPress={onPress}
      style={[styles.choice, { minHeight: hint ? 68 : 56, borderBottomColor: c.line }]}
    >
      {icon ? <Icon name={icon} size={20} color={c.inkPrimary} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <T token="body">{label}</T>
        {hint ? <T token="caption" color={c.inkSecondary}>{hint}</T> : null}
      </View>
      <Icon name="chevronRight" size={16} color={c.inkSecondary} />
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
      <View style={styles.titleBlock}>
        <T style={styles.h1}>{"What's in a typical week?"}</T>
        <T token="callout" color={c.inkSecondary}>Tap everything that applies.</T>
      </View>
      <View style={styles.chips}>
        {chips.map((k) => (
          <Chip key={k.key} label={k.label} icon={k.icon} on={kinds.includes(k.key)} onPress={() => onToggle(k.key)} />
        ))}
      </View>
      <View style={{ gap: 8, paddingTop: 8 }}>
        <T token="overline" color={c.inkSecondary}>What should Semli call you? Optional.</T>
        <TextInput
          value={name}
          onChangeText={onName}
          placeholder="Your first name"
          placeholderTextColor={c.inkTertiary}
          autoCapitalize="words"
          autoCorrect={false}
          style={[styles.input, textStyle("body", c.inkPrimary), { backgroundColor: c.row }]}
        />
      </View>
      <View style={styles.footer}>
        <Button label="Next" onPress={onNext} />
      </View>
    </ScrollView>
  );
}

/* ---------- Watch it work ---------- */

function DemoStep({ profile, onNext }: { profile: Profile; onNext: () => void }) {
  const d = palettes.dark;
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
      <View style={[styles.bubble, { backgroundColor: "rgba(255,255,255,0.92)" }]}>
        <T color={palettes.light.inkPrimary} style={{ fontSize: 15, lineHeight: 21 }}>{typed}</T>
      </View>
      <View style={{ marginTop: "auto", gap: 20 }}>
        <View style={{ gap: 6 }}>
          <T token="display" color={d.inkPrimary}>Just tell it.</T>
          <T token="callout" color={d.inkSecondary}>
            One message became things on your calendar and a plan. Nothing to format, nothing to tap through.
          </T>
        </View>
        <View>
          {rows.slice(0, shown).map((r, i) => (
            <Animated.View key={r.title} entering={enter.rise} style={[styles.demoRow, i < rows.length - 1 ? { borderBottomColor: d.line, borderBottomWidth: StyleSheet.hairlineWidth } : null]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.inkPrimary }} />
              <T color={d.inkPrimary} style={{ flex: 1, fontSize: 15, lineHeight: 21 }}>{r.title}{r.chip ? ` · ${r.chip}` : ""}</T>
              <View style={[styles.demoPill, { backgroundColor: d.addedBg }]}>
                <T token="subhead" color={d.added}>New</T>
              </View>
            </Animated.View>
          ))}
        </View>
        <View style={styles.footer}>
          <Press
            haptic="tap"
            accessibilityRole="button"
            accessibilityState={{ disabled: shown < rows.length }}
            disabled={shown < rows.length}
            onPress={onNext}
            style={[styles.darkButton, { backgroundColor: d.inkPrimary, opacity: shown < rows.length ? 0.4 : 1 }]}
          >
            <T token="headline" color={d.onPrimary}>{shown === rows.length ? "Now try yours" : "Reading…"}</T>
          </Press>
        </View>
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
      <View style={styles.titleBlock}>
        <T style={styles.h1}>Now, your week.</T>
        <T token="callout" color={c.inkSecondary}>
          Paste what’s coming up, or add a screenshot of your schedule. You check what Semli finds before anything is saved.
        </T>
      </View>
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
        <View style={styles.status}>
          <Icon name="alert" size={16} color={c.conflict} />
          <T token="subhead" color={c.conflict} style={{ flex: 1 }}>
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
        <Press haptic="select" accessibilityRole="button" disabled={!!busy} onPress={onSample} style={{ minHeight: 44, justifyContent: "center", alignSelf: "center" }}>
          <T token="subhead" color={c.inkSecondary}>Explore my preview first</T>
        </Press>
      </View>
    </ScrollView>
  );
}

function Action({ icon, label, onPress, disabled }: { icon: IconKey; label: string; onPress: () => void; disabled: boolean }) {
  return <Tile icon={icon} label={label} onPress={onPress} disabled={disabled} />;
}

/* ---------- Heads-up: our sheet first, the system prompt only on yes ---------- */

function HeadsUpStep({ onDone }: { onDone: () => void }) {
  const d = palettes.dark;
  const l = palettes.light;
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
      <Animated.View entering={enter.rise} style={[styles.notification, { backgroundColor: "rgba(255,255,255,0.94)" }]}>
        <View style={[styles.notificationMark, { backgroundColor: l.inkPrimary }]}>
          <View style={[styles.notificationBig, { backgroundColor: l.onPrimary }]} />
          <View style={[styles.notificationSmall, { backgroundColor: l.accent }]} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <T token="overline" color={l.inkPrimary} style={{ fontSize: 12, lineHeight: 16 }}>Semli</T>
            <T token="caption" color={l.inkSecondary}>7:30 am</T>
          </View>
          <T token="callout" color={l.inkPrimary} style={{ fontFamily: textStyle("headline", l.inkPrimary).fontFamily }}>Good morning. 3 things today.</T>
          <T token="callout" color={l.inkSecondary}>Stats lecture 9–10:15, Café shift 4–10. Pharm exam is Friday.</T>
        </View>
      </Animated.View>
      <View style={{ marginTop: "auto", gap: 20 }}>
        <View style={{ gap: 6 }}>
          <T token="display" color={d.inkPrimary}>Want a heads-up?</T>
          <T token="callout" color="#D8D7D0" style={{ maxWidth: 320 }}>
            One note each morning with what’s on, and a nudge before shifts and deadlines. Nothing else, and never at night.
          </T>
        </View>
        <View style={[styles.footer, { alignItems: "center" }]}>
          <Press haptic="tap" accessibilityRole="button" disabled={asking} onPress={() => void yes()} style={[styles.darkButton, { backgroundColor: d.inkPrimary, opacity: asking ? 0.6 : 1 }]}>
            <T token="headline" color={d.onPrimary}>{asking ? "One sec…" : "Yes, remind me"}</T>
          </Press>
          <Press haptic="select" accessibilityRole="button" disabled={asking} onPress={notNow} style={{ minHeight: 44, justifyContent: "center" }}>
            <T token="subhead" color="#D8D7D0">Not now</T>
          </Press>
        </View>
      </View>
    </View>
  );
}

/* ---------- Plus, after the value moment ---------- */

function PlusStep({ onFinish }: { onFinish: () => void }) {
  const trialStarted = useStore((s) => !!s.settings.trial);
  useEffect(() => {
    track("paywall_shown", { reason: "onboarding" });
  }, []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PlanPicker onContinueFree={trialStarted ? undefined : onFinish} />
      {trialStarted ? (
        <View style={styles.footer}>
          <Button label="Continue" onPress={onFinish} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SCREEN_GUTTER },
  progress: { flexDirection: "row", gap: 5, paddingBottom: 24 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  center: { flex: 1 },
  middle: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  page: { flexGrow: 1, gap: 24 },
  titleBlock: { gap: 6 },
  /** Light 30/36, the question size on every onboarding board. */
  h1: { fontFamily: "Geist-Light", fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  footer: { marginTop: "auto", paddingTop: 24, gap: 8, alignSelf: "stretch" },
  choice: { flexDirection: "row", alignItems: "center", gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { height: 52, borderRadius: 999, paddingHorizontal: 20 },
  textarea: { minHeight: 140, borderRadius: 16, padding: 16, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 8 },
  status: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bubble: { alignSelf: "flex-end", maxWidth: 290, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderBottomRightRadius: 6, minHeight: 45, marginTop: 126 },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  demoPill: { height: 26, paddingHorizontal: 9, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  darkButton: { alignSelf: "stretch", height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  notification: { marginTop: 96, flexDirection: "row", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20 },
  notificationMark: { width: 36, height: 36, borderRadius: 9 },
  notificationBig: { position: "absolute", left: 7, bottom: 7, width: 16, height: 16, borderRadius: 8 },
  notificationSmall: { position: "absolute", right: 7, top: 7, width: 7, height: 7, borderRadius: 4 },
});
