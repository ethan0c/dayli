import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Composer } from "@/components/Composer";
import { ChartKey, keyOf } from "@/components/ChartMark";
import { Chip } from "@/components/Controls";
import { RecentShots } from "@/components/RecentShots";
import { File } from "expo-file-system";
import { Press } from "@/components/Press";
import { GlassCircle } from "@/components/Glass";
import { Icon, type IconKey } from "@/components/Icon";
import { PaywallBackdrop } from "@/components/PhotoPaywall";
import { PlanPicker } from "@/components/PlanPicker";
import { Reading } from "@/components/Reading";
import { WeekChart, compactRange, type WeekDay } from "@/components/WeekChart";
import { Button } from "@/components/Sheet";
import { T } from "@/components/Text";
import { profile as setProfile, track } from "@/lib/analytics";
import { Photo } from "@/components/Photo";
import { SHOWCASE } from "@/lib/images";
import { requestExtraction } from "@/lib/api";
import { requestImport } from "@/lib/import-auth";
import { IMPORT_MESSAGES } from "@dayli/schema";
import { InputError, extractionContext, pickImageInput, pickPdfInput } from "@/lib/capture-input";
import { devStep } from "@/lib/dev";
import { feedback } from "@/lib/feedback";
import { reportError } from "@/lib/errors";
import { durations, enter, exit, springs } from "@/lib/motion";
import { MAJORS, chipsFor, profileFor, type DemoRow, type Profile, type Role } from "@/lib/majors";
import { requestNotifications, syncReminders } from "@/lib/notifications";
import { usePlusAccess } from "@/lib/plus-access";
import { purchaseErrorMessage } from "@/lib/revenuecat";
import { syncCanvas } from "@/lib/canvas-sync";
import { normalizeFeedUrl, CANVAS_MESSAGES } from "@/lib/canvas";
import { useStore, type Lms } from "@/store";
import { palettes } from "@dayli/tokens";
import { addDays, localParts, weekOf } from "@dayli/core";

import { ForceAppearance, SCREEN_GUTTER, textStyle, useTheme } from "@/theme";

/**
 * One real result before any ask. The order follows docs/onboarding-research.md §3:
 * three one-tap questions → the demo → your own import → the review sheet (the aha)
 * → reminders priming → the paywall after value → Today.
 */
const STEPS = ["role", "major", "week", "lms", "demo", "own", "canvas", "heads-up", "plus"] as const;
type Step = (typeof STEPS)[number];
/** The progress bar: Canvas connect takes the own-import slot, so both paths fill the same bars. */
const BARS = STEPS.filter((s) => s !== "canvas");

/** Only Canvas syncs today; the other answers tell us which feed to support next. */
const PLATFORMS: { id: Lms; label: string; hint?: string }[] = [
  { id: "canvas", label: "Canvas", hint: "Import due dates free. Keep them in sync with Plus." },
  { id: "blackboard", label: "Blackboard" },
  { id: "brightspace", label: "Brightspace (D2L)" },
  { id: "moodle", label: "Moodle" },
  { id: "classroom", label: "Google Classroom" },
  { id: "other", label: "Something else, or not sure" },
];

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
  const requested = (STEPS as readonly string[]).includes(params.step ?? "") ? (params.step as Step) : "role";
  const [step, setStep] = useState<Step>(requested);
  // Reset when the link changes (derived state, no effect).
  const [lastRequested, setLastRequested] = useState(requested);
  if (lastRequested !== requested) {
    setLastRequested(requested);
    setStep(requested);
  }

  // Development: `dev-step.txt` in Documents opens a step directly (see lib/dev.ts).
  useEffect(() => {
    void devStep().then((v) => {
      if (v === "welcome") router.replace("/auth");
      else if (v && (STEPS as readonly string[]).includes(v)) setStep(v as Step);
    });
  }, []);

  const [name, setName] = useState(settings.name);
  const [role, setRole] = useState<Role>(settings.isStudent ? "both" : "working");
  const [major, setMajor] = useState<string | null>(settings.major);
  const [kinds, setKinds] = useState<string[]>(settings.weekKinds);
  const [lms, setLms] = useState<Lms | null>(settings.lms);
  const [usedSample, setUsedSample] = useState(false);
  const student = role !== "working";
  const profile = profileFor(major, student);

  const [history, setHistory] = useState<Step[]>([]);
  const go = (next: Step) => {
    feedback("tap");
    track("onboarding_step", { step: next });
    setHistory((h) => [...h, step]);
    setStep(next);
  };
  // The first question goes back to the welcome screen, which replaced itself with onboarding.
  const canGoBack = history.length > 0 || step === "role";
  const back = () => {
    const previous = history[history.length - 1];
    if (!previous) {
      if (step !== "role") return;
      feedback("tap");
      router.replace("/auth");
      return;
    }
    feedback("tap");
    setHistory((h) => h.slice(0, -1));
    setStep(previous);
  };

  // The review sheet flips this when the first import is confirmed; carry on to the heads-up.
  const [seenImportDone, setSeenImportDone] = useState(importDone);
  if (importDone !== seenImportDone) {
    setSeenImportDone(importDone);
    if (importDone && (step === "own" || step === "canvas")) setStep("heads-up");
  }

  const saveProfile = () =>
    setSettings({ name: name.trim(), weekKinds: kinds, isStudent: student, major: student ? (major ?? "other") : null });

  const finish = () => {
    // Working people start on the day by the hour, where shifts and overlaps read best; students on the list.
    const todayView = role === "student" ? "list" : "hours";
    setSettings({ onboarded: true, seeded: true, onboardingImportDone: false, todayView });
    track("onboarding_completed", { role, major: student ? (major ?? "other") : null, sample: usedSample });
    setProfile({ role, major: student ? (major ?? "other") : null, lms: lms ?? null, today_view: todayView, today_view_source: "role" });
    feedback("success");
    showToast(usedSample ? "Your preview is ready. Add your own details any time." : "You're set.");
    router.replace("/");
  };

  const progress = BARS.indexOf(step === "canvas" ? "own" : step);
  // Watch it work and the heads-up are showcase pages: dark, ready for a full-bleed photo.
  const showcase = step === "demo" || step === "heads-up" || step === "plus";
  const bg = showcase ? palettes.dark.canvas : c.canvas;
  const barOn = showcase ? palettes.dark.inkPrimary : c.inkPrimary;
  const barOff = showcase ? "rgba(245,244,240,0.3)" : c.line;

  if (params.step === "welcome") return <Redirect href="/auth" />;

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 24) }]}>
      {step === "demo" ? <Backdrop key="bg-demo" source={PHOTOS.demo} height={420} fadeFrom={180} /> : null}
      {step === "heads-up" ? <Backdrop key="bg-heads-up" source={PHOTOS.headsup} full /> : null}
      {step === "plus" ? <PaywallBackdrop /> : null}
      <View style={styles.header}>
        {canGoBack ? (
          <Animated.View entering={enter.fade} exiting={exit.fade}>
            <Press accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} scale={0.9} onPress={back} style={styles.back}>
              <GlassCircle size={36} plain><Icon name="chevronLeft" size={22} color={barOn} /></GlassCircle>
            </Press>
          </Animated.View>
        ) : null}
        <View style={styles.progress}>
          {BARS.map((s, i) => (
            <Segment key={s} on={i <= progress} fill={barOn} track={barOff} />
          ))}
        </View>
      </View>

      <Animated.View key={step} entering={enter.fromRight} style={{ flex: 1 }}>
      {step === "role" && (
        <OneTapStep title="Which best describes you?" subtitle="We’ll tailor the examples to your week." gap={28}>
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
        <OneTapStep title="What are you studying?" subtitle="Choose the closest match. You can change it later in You.">
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
            go(student ? "lms" : "demo");
          }}
        />
      )}
      {step === "lms" && (
        <OneTapStep title="Where do you find your assignments?" subtitle="Use Canvas? Import your due dates free and keep them in sync with Plus.">
          {PLATFORMS.map((p) => (
            <Choice
              key={p.id}
              label={p.label}
              hint={p.hint}
              on={lms === p.id}
              onPress={() => {
                setLms(p.id);
                setSettings({ lms: p.id });
                track("onboarding_step", { step: "lms", lms: p.id });
                go("demo");
              }}
            />
          ))}
        </OneTapStep>
      )}
      {step === "demo" && <DemoStep key={profile.id} profile={profile} onNext={() => go(student && lms === "canvas" ? "canvas" : "own")} />}
      {step === "canvas" && <CanvasStep onConnected={() => go("heads-up")} onInstead={() => go("own")} />}
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

/** The same photos as the design boards. Stand-ins until the final set is sourced. */
const PHOTOS = SHOWCASE;

const FADE_STEPS = 28;

/**
 * A full-bleed photo behind a showcase step, fading into the dark canvas the way the boards do.
 * The fade is stacked strips, so no native gradient module is needed.
 */
function Backdrop({ source, height, fadeFrom = 0, full = false, dim = 0 }: { source: number; height?: number; fadeFrom?: number; full?: boolean; dim?: number }) {
  const { height: screen } = useWindowDimensions();
  const h = full ? screen : (height ?? screen);
  const dark = palettes.dark.canvas;
  const fadeTop = full ? screen * 0.45 : fadeFrom;
  const fadeH = h - fadeTop;
  return (
    <Animated.View pointerEvents="none" entering={enter.fade} exiting={exit.fade} style={[StyleSheet.absoluteFill, { height: h }]}>
      <Photo source={source} style={{ width: "100%", height: h }} />
      {full ? <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: screen * 0.3, backgroundColor: "rgba(21,21,21,0.15)" }} /> : null}
      {dim > 0 ? <View style={[StyleSheet.absoluteFill, { backgroundColor: dark, opacity: dim }]} /> : null}
      <View style={{ position: "absolute", left: 0, right: 0, top: fadeTop, height: fadeH }}>
        {Array.from({ length: FADE_STEPS }, (_, i) => {
          const t = (i + 1) / FADE_STEPS;
          const alpha = full ? 0.2 + 0.72 * t * t : Math.pow(t, 1.4);
          return <View key={i} style={{ flex: 1, backgroundColor: dark, opacity: Math.min(1, alpha) }} />;
        })}
      </View>
    </Animated.View>
  );
}

/** One bar of the position indicator: fills from the left on a spring, drains the same way. */
function Segment({ on, fill, track }: { on: boolean; fill: string; track: string }) {
  const p = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(on ? 1 : 0, springs.gentle);
  }, [on, p]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.001, p.value) }] }));
  return (
    <View style={[styles.bar, { backgroundColor: track, overflow: "hidden" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fill, transformOrigin: "left" }, style]} />
    </View>
  );
}

/* ---------- Welcome: the wordmark assembles itself ---------- */

/* ---------- One question per screen, auto-advance ---------- */

function OneTapStep({ title, subtitle, children, gap = 24 }: { title: string; subtitle: string; children: React.ReactNode; gap?: number }) {
  const { c } = useTheme();
  return (
    <ScrollView contentContainerStyle={[styles.page, { gap }]}>
      <View style={styles.titleBlock}>
        <T token="displaySm" accessibilityRole="header">{title}</T>
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
        <T token="displaySm" accessibilityRole="header">{"What's in your typical week?"}</T>
        <T token="callout" color={c.inkSecondary}>Tap everything that applies.</T>
      </View>
      <View style={styles.chips}>
        {chips.map((k) => (
          <Chip key={k.key} label={k.label} icon={k.icon} on={kinds.includes(k.key)} onPress={() => onToggle(k.key)} />
        ))}
      </View>
      <View style={{ gap: 8, paddingTop: 8 }}>
        <T token="overline" color={c.inkSecondary}>Your first name (optional)</T>
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
  const done = shown === rows.length;
  // The demo is always the coming Monday to Sunday, so the days on the chart are real dates.
  const [week] = useState(() => {
    const today = localParts(new Date()).date;
    return weekOf(addDays(today, 7));
  });

  useEffect(() => {
    let i = 0;
    let type: ReturnType<typeof setInterval> | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Typing waits for the page to finish sliding in, so the two never compete.
    timers.push(
      setTimeout(() => {
        type = setInterval(() => {
          i += 2;
          setTyped(text.slice(0, i));
          if (i >= text.length) {
            clearInterval(type);
            rows.forEach((_, idx) => {
              timers.push(
                setTimeout(() => {
                  setShown(idx + 1);
                  feedback(idx === rows.length - 1 ? "ready" : "select");
                }, durations.slow * (idx + 1)),
              );
            });
          }
        }, 28);
      }, durations.base),
    );
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
          <T token="displaySerif" color={d.inkPrimary}>Just tell it.</T>
          <T token="callout" color={d.inkSecondary}>
            One message turns into events and to-dos. Write naturally, then review what Semli finds.
          </T>
        </View>
        {/* The week and every row keep their space from the start, so nothing jumps as rows land. */}
        <ForceAppearance.Provider value="dark">
          <View style={{ gap: 10 }}>
            <WeekChart days={demoWeek(week, rows.slice(0, shown))} today={localParts(new Date()).date} height={64} animate
              accessibilityLabel={done ? rows.map((r) => `${r.title}, ${r.chip ?? ""}`).join(". ") : "An empty week"} />
            <ChartKey entries={keyOf([
              { glyph: "block", color: d.added, label: "New" },
              rows.some((r) => !r.at.end && r.icon === "exam") && { glyph: "target", color: d.chartBooked, label: "Exam" },
              rows.some((r) => !r.at.end && r.icon !== "exam") && { glyph: "dot", color: d.chartBooked, label: "Due" },
            ])} />
          </View>
        </ForceAppearance.Provider>
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {rows.map((r, i) => (
            <View key={r.title} style={[styles.demoRow, { borderBottomColor: i < shown && i < rows.length - 1 ? d.line : "transparent" }]}>
              {i < shown ? (
                <Animated.View entering={enter.rise} style={styles.demoRowInner}>
                  <Icon name={r.icon} size={18} color={d.inkPrimary} />
                  <T token="body" color={d.inkPrimary} numberOfLines={1} style={{ flex: 1 }}>{r.title}</T>
                  <T token="caption" color={d.inkSecondary} tabular>{r.chip}</T>
                </Animated.View>
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.footer}>
          <Press
            haptic="tap"
            accessibilityRole="button"
            accessibilityState={{ disabled: !done }}
            disabled={!done}
            onPress={onNext}
            style={[styles.darkButton, { backgroundColor: d.inkPrimary, opacity: done ? 1 : 0.4 }]}
          >
            <Animated.View key={done ? "go" : "wait"} entering={enter.fade}>
              <T token="headline" color={d.onPrimary}>{done ? "Now try yours" : "Reading…"}</T>
            </Animated.View>
          </Press>
        </View>
      </View>
    </View>
  );
}

/** The demo rows on the week chart: spans become new (green) blocks, single times a due dot or an exam target. */
function demoWeek(week: string[], rows: DemoRow[]): WeekDay[] {
  return week.map((date, i) => {
    const here = rows.filter((r) => r.at.day === i);
    const span = here.find((r) => r.at.end);
    return {
      date,
      blocks: here.filter((r) => r.at.end).map((r) => ({ id: r.title, start: r.at.start, end: r.at.end!, tone: "green" as const })),
      marks: here.filter((r) => !r.at.end).map((r) => ({ id: r.title, time: r.at.start, kind: r.icon === "exam" ? ("target" as const) : ("dot" as const) })),
      label: span ? compactRange(span.at.start, span.at.end!) : undefined,
      labelTone: span ? ("green" as const) : undefined,
    };
  });
}

/* ---------- Bring your own, or continue to a personalized display-only preview ---------- */

function OwnStep({ onSample }: { onSample: () => void }) {
  const { c } = useTheme();
  const { requireImportAccess, requirePlus } = usePlusAccess();
  const importing = useRef(false);
  const apiUrl = useStore((s) => s.settings.apiUrl);
  const setPending = useStore((s) => s.setPending);
  const recordImport = useStore((s) => s.recordImport);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(input: NonNullable<Picked>["input"], source: string) {
    if (importing.current) return;
    importing.current = true;
    setError(null);
    setBusy(source);
    track("import_started", { kind: input.kind, where: "onboarding" });
    try {
      try {
        if (!(await requireImportAccess())) return;
      } catch (failure) {
        setError(purchaseErrorMessage(failure));
        return;
      }
      const req = { input, context: extractionContext() };
      let res = await requestImport(apiUrl, req);
      if (!res.ok && res.error === IMPORT_MESSAGES.quota && (await requirePlus("quota"))) res = await requestImport(apiUrl, req);
      if (!res.ok) {
        track("import_failed", { kind: input.kind, where: "onboarding" });
        setError(res.error);
        return;
      }
      if (res.extraction.items.length === 0) {
        setError("Semli couldn't find any dates. Add a day or time and try again, or explore your preview for now.");
        return;
      }
      feedback("ready");
      recordImport();
      track("import_succeeded", { kind: input.kind, items: res.extraction.items.length, type: res.extraction.detected_type, where: "onboarding" });
      setPending({ extraction: res.extraction, source });
      router.push("/review");
    } catch (failure) {
      reportError("onboarding.import", failure);
      track("import_failed", { kind: input.kind, where: "onboarding" });
      setError("Semli couldn't read that right now. Try again, or explore your preview for now.");
    } finally {
      importing.current = false;
      setBusy(null);
    }
  }

  const pick = async (fn: () => Promise<Picked>) => {
    setError(null);
    try {
      const picked = await fn();
      if (picked) await run(picked.input, picked.source);
    } catch (e) {
      reportError("onboarding.pick_file", e);
      setError(e instanceof InputError ? e.message : "Semli couldn't open that. Try another file, or type it instead.");
    }
  };

  async function openShot(uri: string) {
    if (!uri) return pick(() => pickImageInput(false));
    setError(null);
    try {
      const data = await new File(uri).base64();
      const lower = uri.toLowerCase();
      const mediaType = lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : "image/jpeg";
      await run({ kind: "image", mediaType, data }, "Screenshot");
    } catch (failure) {
      reportError("onboarding.open_screenshot", failure);
      setError("We couldn't open that screenshot. Try choosing it from your photos instead.");
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { gap: 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.titleBlock}>
        <T token="displaySm" accessibilityRole="header">Now, your week.</T>
        <T token="callout" color={c.inkSecondary}>Type it, paste it, or add a screenshot.</T>
      </View>
      {busy ? (
        <Reading source={busy === "Message" ? "your message" : busy} chart={/\.pdf$/i.test(busy) ? "term" : "week"} />
      ) : (
        <Composer
          value={text}
          onChangeText={setText}
          canSend={text.trim().length > 0}
          onPickImage={() => void pick(() => pickImageInput(false))}
          onCamera={() => void pick(() => pickImageInput(true))}
          onPickPdf={() => void pick(pickPdfInput)}
          onSend={() => void run({ kind: "text", text: text.trim() }, "Message")}
        />
      )}
      {error ? (
        <View style={styles.status}>
          <Icon name="alert" size={16} color={c.conflict} />
          <T token="subhead" color={c.conflict} style={{ flex: 1 }}>
            {error}
          </T>
        </View>
      ) : null}
      {!busy ? <RecentShots onPick={(uri) => void openShot(uri)} /> : null}
      <View style={styles.footer}>
        <Button label="Skip for now" variant="secondary" disabled={!!busy} onPress={onSample} />
      </View>
    </ScrollView>
  );
}

/* ---------- Canvas: the feed link is their first real import ---------- */

function CanvasStep({ onConnected, onInstead }: { onConnected: () => void; onInstead: () => void }) {
  const { c } = useTheme();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  const connect = async () => {
    const url = normalizeFeedUrl(link);
    if (!url) {
      feedback("error");
      setError(CANVAS_MESSAGES.link);
      return;
    }
    setError(null);
    setBusy(true);
    const res = await syncCanvas(url);
    setBusy(false);
    if (!res.ok) {
      feedback("error");
      setError(res.error);
      track("onboarding_step", { step: "canvas-failed" });
      return;
    }
    feedback("success");
    track("onboarding_step", { step: "canvas-connected", items: res.total });
    setAdded(res.total);
  };

  if (added !== null) {
    return (
      <View style={styles.page}>
        <Animated.View entering={enter.rise} style={styles.titleBlock}>
          <T token="callout" color={c.inkSecondary}>From Canvas</T>
          <T token="displayXl" tabular>{`${added} ${added === 1 ? "item" : "items"}`}</T>
          <T token="callout" color={c.inkSecondary}>
            {added > 0 ? "Your Canvas calendar is connected. With Plus, Semli checks for updates when you open the app." : "Your Canvas calendar is connected, with no items to import yet. With Plus, Semli checks for new ones when you open the app."}
          </T>
        </Animated.View>
        <View style={styles.footer}>
          <Button label="Next" onPress={onConnected} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { gap: 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.titleBlock}>
        <T token="displaySm" accessibilityRole="header">Connect Canvas.</T>
        <T token="callout" color={c.inkSecondary}>Paste your calendar feed link once. Semli only reads it, and nothing you do here changes Canvas.</T>
      </View>
      <View>
        {["Open Canvas in a browser. A laptop is easiest.", "Go to Calendar, then Calendar feed at the bottom of the sidebar.", "Copy the link and paste it below."].map((line, i) => (
          <View key={line} style={[styles.choice, { minHeight: 52, borderBottomColor: c.line }]}>
            <T token="headline" tabular style={{ width: 18 }}>{String(i + 1)}</T>
            <T token="body" style={{ flex: 1 }}>{line}</T>
          </View>
        ))}
      </View>
      <TextInput
        value={link}
        onChangeText={(v) => { setLink(v); setError(null); }}
        placeholder="https://…/feeds/calendars/…"
        placeholderTextColor={c.inkTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={!busy}
        style={[styles.input, textStyle("body", c.inkPrimary), { backgroundColor: c.row }]}
      />
      {error ? (
        <Animated.View entering={enter.drop} exiting={exit.fade} accessibilityRole="alert" style={styles.status}>
          <Icon name="alert" size={16} color={c.conflict} />
          <T token="subhead" color={c.conflict} style={{ flex: 1 }}>{error}</T>
        </Animated.View>
      ) : null}
      <View style={[styles.footer, { alignItems: "center" }]}>
        <Button label={busy ? "Reading Canvas…" : "Connect Canvas"} disabled={busy || !link.trim()} onPress={() => void connect()} />
        <Press haptic="select" accessibilityRole="button" disabled={busy} onPress={onInstead} style={{ minHeight: 44, justifyContent: "center" }}>
          <T token="subhead" color={c.inkSecondary}>Use a screenshot or syllabus instead</T>
        </Press>
      </View>
    </ScrollView>
  );
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
          <T token="callout" color={l.inkPrimary} style={{ fontFamily: textStyle("headline", l.inkPrimary).fontFamily }}>Good morning. 2 things today.</T>
          <T token="callout" color={l.inkSecondary}>Stats lecture 9–10:15, Café shift 4–10. Pharm exam is Friday.</T>
        </View>
      </Animated.View>
      <View style={{ marginTop: "auto", gap: 20 }}>
        <View style={{ gap: 6 }}>
          <T token="displaySerif" color={d.inkPrimary}>Want a heads-up?</T>
          <T token="callout" color="#D8D7D0" style={{ maxWidth: 320 }}>
            A morning summary of what’s coming up, plus reminders before events and deadlines. Choose your reminder times in You.
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
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    track("paywall_shown", { reason: "onboarding" });
  }, []);
  return (
    <ScrollView ref={scroll} contentContainerStyle={[styles.page, { paddingTop: 150 }]} showsVerticalScrollIndicator={false}>
      <PlanPicker palette={palettes.dark} onContinueFree={onFinish} onComplete={onFinish} onWelcome={() => scroll.current?.scrollTo({ y: 0, animated: false })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SCREEN_GUTTER },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 24, minHeight: 36 },
  back: { marginLeft: -8, alignItems: "center", justifyContent: "center" },
  progress: { flex: 1, flexDirection: "row", gap: 5 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  center: { flex: 1 },
  page: { flexGrow: 1, gap: 24 },
  titleBlock: { gap: 6 },
  footer: { marginTop: "auto", paddingTop: 24, gap: 8, alignSelf: "stretch" },
  choice: { flexDirection: "row", alignItems: "center", gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { height: 52, borderRadius: 999, paddingHorizontal: 20 },
  textarea: { minHeight: 140, borderRadius: 16, padding: 16, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 8 },
  status: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bubble: { alignSelf: "flex-end", maxWidth: 290, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderBottomRightRadius: 6, minHeight: 45, marginTop: 24 },
  demoRow: { height: 44, justifyContent: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  demoRowInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  demoPill: { height: 26, paddingHorizontal: 9, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  darkButton: { alignSelf: "stretch", height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  notification: { marginTop: 120, flexDirection: "row", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20 },
  notificationMark: { width: 36, height: 36, borderRadius: 9 },
  notificationBig: { position: "absolute", left: 7, bottom: 7, width: 16, height: 16, borderRadius: 8 },
  notificationSmall: { position: "absolute", right: 7, top: 7, width: 7, height: 7, borderRadius: 4 },
});
