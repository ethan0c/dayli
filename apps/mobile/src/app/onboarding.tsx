import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Composer } from "@/components/Composer";
import { RecentShots } from "@/components/RecentShots";
import { File } from "expo-file-system";
import { Press } from "@/components/Press";
import { GlassCircle } from "@/components/Glass";
import { Icon } from "@/components/Icon";
import { PaywallBackdrop } from "@/components/PhotoPaywall";
import { PlanPicker } from "@/components/PlanPicker";
import { Reading } from "@/components/Reading";
import { Button } from "@/components/Sheet";
import { T } from "@/components/Text";
import { profile as setProfile, track } from "@/lib/analytics";
import { requestExtraction } from "@/lib/api";
import { requestImport } from "@/lib/import-auth";
import { IMPORT_MESSAGES } from "@dayli/schema";
import { InputError, extractionContext, pickImageInput, pickPdfInput } from "@/lib/capture-input";
import { devStep } from "@/lib/dev";
import { feedback } from "@/lib/feedback";
import { reportError } from "@/lib/errors";
import { enter, exit, layout, springs } from "@/lib/motion";
import { requestNotifications, syncReminders } from "@/lib/notifications";
import { usePlusAccess } from "@/lib/plus-access";
import { purchaseErrorMessage } from "@/lib/revenuecat";
import { syncCanvas } from "@/lib/canvas-sync";
import { normalizeFeedUrl, CANVAS_MESSAGES } from "@/lib/canvas";
import { useCourseList, useItemList, useStore, type DeadlineSource, type Plate } from "@/store";
import { sampleWeek } from "@/store/sample";
import { palettes } from "@dayli/tokens";
import { localParts, monthDay, relativeDay, termSummary, weekOf, weekdayLong } from "@dayli/core";

import { SCREEN_GUTTER, textStyle, useTheme } from "@/theme";

/**
 * Ask less, build their week, then ask (docs/conversion.md, decided Oct 21, 2026): two tap
 * questions that each change something, their own import (or a real sample), the facts of their
 * term, a reminder they choose, then the paywall. No slideshows, no fake loaders, account later.
 */
const STEPS = ["plate", "deadlines", "own", "canvas", "result", "remind", "plus"] as const;
type Step = (typeof STEPS)[number];
/** The progress bar: Canvas connect takes the own-import slot, so both paths fill the same bars. */
const BARS = STEPS.filter((s) => s !== "canvas");

type Picked = { input: Parameters<typeof requestExtraction>[1]["input"]; source: string } | null;

const PLATES: { id: Plate; label: string; hint: string }[] = [
  { id: "classes", label: "Classes", hint: "Lectures, labs, exams and due dates" },
  { id: "job", label: "Work", hint: "Shifts and changing work schedules" },
  { id: "clubs", label: "Clubs and activities", hint: "Practice, rehearsals and meetings" },
];

const SOURCES: { id: DeadlineSource; label: string; hint: string }[] = [
  { id: "canvas", label: "Canvas", hint: "Connect your calendar. Keep it in sync with Plus." },
  { id: "syllabus", label: "A syllabus PDF", hint: "Import exams and due dates, then review them." },
  { id: "screenshots", label: "Screenshots and messages", hint: "Work schedules, group chats or printed schedules." },
  { id: "nowhere", label: "I’ll add them myself", hint: "Type what’s coming up, or try a sample week." },
];

export default function OnboardingScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const applyPlan = useStore((s) => s.applyPlan);
  const showToast = useStore((s) => s.showToast);
  const importDone = useStore((s) => s.settings.onboardingImportDone);

  // `?step=plus` opens a specific step; useful when previewing copy and layout.
  const params = useLocalSearchParams<{ step?: string }>();
  const requested = (STEPS as readonly string[]).includes(params.step ?? "") ? (params.step as Step) : "plate";
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

  const [plate, setPlate] = useState<Plate[]>(settings.plate);
  const [source, setSource] = useState<DeadlineSource | null>(settings.deadlineSource);
  const [usedSample, setUsedSample] = useState(false);
  const job = plate.includes("job");

  const [history, setHistory] = useState<Step[]>([]);
  const go = (next: Step, answers: Record<string, string | number | boolean> = {}) => {
    feedback("tap");
    track("onboarding_step", { step: next, ...answers });
    setHistory((h) => [...h, step]);
    setStep(next);
  };
  // The first question goes back to the welcome screen, which replaced itself with onboarding.
  const canGoBack = history.length > 0 || step === "plate";
  const back = () => {
    const previous = history[history.length - 1];
    track("onboarding_back", { from: step });
    if (!previous) {
      if (step !== "plate") return;
      feedback("tap");
      router.replace("/auth");
      return;
    }
    feedback("tap");
    setHistory((h) => h.slice(0, -1));
    setStep(previous);
  };

  // The review sheet flips this when the first import is confirmed; carry on to the term at a glance.
  const [seenImportDone, setSeenImportDone] = useState(importDone);
  if (importDone !== seenImportDone) {
    setSeenImportDone(importDone);
    if (importDone && (step === "own" || step === "canvas")) {
      setHistory((h) => [...h, step]);
      setStep("result");
    }
  }

  const answerPlate = () => {
    const student = plate.includes("classes") || plate.includes("clubs");
    setSettings({ plate, isStudent: student });
    // A job only: the first import is their shifts, so there's nothing to ask about deadlines.
    if (!student) {
      setSource("screenshots");
      setSettings({ deadlineSource: "screenshots" });
      go("own", { plate: plate.join(","), source: "screenshots" });
    } else go("deadlines", { plate: plate.join(",") });
  };

  const answerSource = (id: DeadlineSource) => {
    setSource(id);
    setSettings({ deadlineSource: id, ...(id === "canvas" ? { lms: "canvas" as const } : {}) });
    go(id === "canvas" ? "canvas" : "own", { source: id });
  };

  /** "Try a sample": a real, labelled sample week as one undoable change, removed by the first real import. */
  const loadSample = () => {
    const today = localParts(new Date()).date;
    const student = useStore.getState().settings.isStudent;
    const week = sampleWeek(today, { student, preview: true });
    const create = week.items.map(({ id: _id, createdAt: _at, batchId: _batch, sourceId: _source, ...rest }) => rest);
    const batchId = applyPlan({ create, update: [], remove: [], skipped: 0 }, "Sample week", { source: "Sample week", courses: week.courses });
    setSettings({ sampleBatchId: batchId });
    setUsedSample(true);
    track("import_succeeded", { kind: "sample", items: create.length, where: "onboarding" });
    go("result", { sample: true });
  };

  const finish = () => {
    // A job opens on the day by the hour, where shifts and overlaps read best; otherwise the list.
    const todayView = job ? "hours" : "list";
    setSettings({ onboarded: true, seeded: true, onboardingImportDone: false, todayView });
    track("onboarding_completed", { plate: plate.join(","), source: source ?? "none", sample: usedSample });
    setProfile({ plate: plate.join(","), deadline_source: source ?? null, lms: settings.lms ?? null, today_view: todayView, today_view_source: "plate" });
    feedback("success");
    // The sample may have been replaced by a real import since it was loaded; say what is there now.
    const sampleLeft = !!useStore.getState().settings.sampleBatchId;
    showToast(sampleLeft ? "Your sample week is ready. Add your own plans any time." : "Your plan is ready.");
    router.replace("/");
  };

  const progress = BARS.indexOf(step === "canvas" ? "own" : step);
  // Only the paywall is a dark showcase now; every other step is the plain paper canvas.
  const showcase = step === "plus";
  const bg = showcase ? palettes.dark.canvas : c.canvas;
  const barOn = showcase ? palettes.dark.inkPrimary : c.inkPrimary;
  const barOff = showcase ? "rgba(245,244,240,0.3)" : c.line;

  if (params.step === "welcome") return <Redirect href="/auth" />;

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 24) }]}>
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
      {step === "plate" && (
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.titleBlock}>
            <T token="displaySm" accessibilityRole="header">What do you need to plan?</T>
            <T token="callout" color={c.inkSecondary}>Choose all that apply.</T>
          </View>
          <View accessibilityRole="list">
            {PLATES.map((p) => (
              <Choice key={p.id} label={p.label} hint={p.hint} multi on={plate.includes(p.id)}
                onPress={() => setPlate((ps) => (ps.includes(p.id) ? ps.filter((x) => x !== p.id) : [...ps, p.id]))} />
            ))}
          </View>
          <View style={styles.footer}>
            <Button label="Next" disabled={plate.length === 0} onPress={answerPlate} />
          </View>
        </ScrollView>
      )}
      {step === "deadlines" && (
        <OneTapStep title="Where do you keep your deadlines?" subtitle="Choose one to start with.">
          {SOURCES.map((s) => (
            <Choice key={s.id} label={s.label} hint={s.hint} on={source === s.id} onPress={() => answerSource(s.id)} />
          ))}
        </OneTapStep>
      )}
      {step === "canvas" && <CanvasStep onConnected={() => go("result")} onInstead={() => go("own", { source: "canvas-instead" })} />}
      {step === "own" && <OwnStep source={source ?? "nowhere"} job={job} onSample={loadSample} />}
      {/* Reminders ring on the iPhone, so the web skips the question of when. */}
      {step === "result" && <ResultStep sample={!!settings.sampleBatchId} onNext={() => go(Platform.OS === "web" ? "plus" : "remind")} />}
      {step === "remind" && <RemindStep onDone={() => go("plus")} />}
      {step === "plus" && <PlusStep onFinish={finish} />}
      </Animated.View>
    </View>
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

/* ---------- One question per screen ---------- */

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

/** A choice row. One-tap rows advance (chevron); `multi` rows toggle an ink checkbox. */
function Choice({ label, hint, on, multi, onPress }: { label: string; hint?: string; on: boolean; multi?: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Press
      haptic="select"
      scale={1}
      accessibilityRole={multi ? "checkbox" : "button"}
      accessibilityState={multi ? { checked: on } : undefined}
      accessibilityLabel={!multi && on ? `${label}, selected` : label}
      onPress={onPress}
      style={[styles.choice, { minHeight: hint ? 68 : 56, borderBottomColor: c.line }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <T token="body">{label}</T>
        {hint ? <T token="caption" color={c.inkSecondary}>{hint}</T> : null}
      </View>
      {multi ? (
        <View style={[styles.box, on ? { backgroundColor: c.inkPrimary, borderColor: c.inkPrimary } : { borderColor: c.controlOutline }]}>
          {on ? <Icon name="tick" size={14} color={c.onPrimary} strokeWidth={2.5} /> : null}
        </View>
      ) : <Icon name="chevronRight" size={16} color={c.inkSecondary} />}
    </Press>
  );
}

/* ---------- Their own import, starting where their deadlines live ---------- */

const OWN_COPY: Record<DeadlineSource, { title: string; sub: string; primary?: "pdf" | "image"; sample: string }> = {
  canvas: { title: "Add your syllabus.", sub: "You can also use a screenshot or message. Review the dates before adding them.", primary: "pdf", sample: "Try a sample week instead" },
  syllabus: { title: "Add your syllabus.", sub: "Semli finds exams and due dates. You review them before adding them.", primary: "pdf", sample: "No syllabus handy? Try a sample week" },
  screenshots: { title: "Add a screenshot or photo.", sub: "Choose a work schedule, a message with dates or a printed schedule.", primary: "image", sample: "Try a sample week instead" },
  nowhere: { title: "What’s coming up?", sub: "Type or paste a few plans. Include the days and times you know.", sample: "Try a sample week instead" },
};

function OwnStep({ source, job, onSample }: { source: DeadlineSource; job: boolean; onSample: () => void }) {
  const { c } = useTheme();
  const copy = OWN_COPY[source];
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
        setError("We couldn’t find any plans to add. Include a day or time and try again, or try a sample week.");
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
      setError("We couldn’t read that. Try again, or try a sample week.");
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
        <T token="displaySm" accessibilityRole="header">{copy.title}</T>
        <T token="callout" color={c.inkSecondary}>{job && source !== "screenshots" ? `${copy.sub} You can add work shifts later.` : copy.sub}</T>
      </View>
      {!busy && copy.primary ? (
        <Button label={copy.primary === "pdf" ? "Choose a syllabus PDF" : "Choose a photo or screenshot"}
          onPress={() => void pick(copy.primary === "pdf" ? pickPdfInput : () => pickImageInput(false))} />
      ) : null}
      {busy ? (
        <Reading source={busy === "Message" ? "your message" : busy} chart={/\.pdf$/i.test(busy) ? "term" : "week"} />
      ) : (
        <Composer
          value={text}
          placeholder={job ? "Working Friday 4–10 pm, team meeting Monday at noon…" : "Biology exam next Friday, essay due Monday at 5 pm…"}
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
      <View style={[styles.footer, { alignItems: "center" }]}>
        <Press haptic="select" accessibilityRole="button" disabled={!!busy} onPress={onSample} style={{ minHeight: 44, justifyContent: "center" }}>
          <T token="subhead" color={c.inkSecondary}>{copy.sample}</T>
        </Press>
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
            {added > 0 ? "Your Canvas calendar is connected. Plus keeps it up to date when you open Semli." : "Your Canvas calendar is connected. There’s nothing to add yet. Plus checks for updates when you open Semli."}
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
        <T token="callout" color={c.inkSecondary}>Paste your Canvas calendar link to add its dates to Semli. Your Canvas calendar stays unchanged.</T>
      </View>
      <View>
        {["Open Canvas in your browser.", "Go to Calendar and select Calendar feed in the sidebar.", "Copy the calendar link and paste it below."].map((line, i) => (
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
          <T token="subhead" color={c.inkSecondary}>Add another way</T>
        </Press>
      </View>
    </ScrollView>
  );
}

/* ---------- Their term, from what they just added ---------- */

function ResultStep({ sample, onNext }: { sample: boolean; onNext: () => void }) {
  const { c } = useTheme();
  const items = useItemList();
  const today = localParts(new Date()).date;
  const s = useMemo(() => termSummary(items, today), [items, today]);
  useEffect(() => {
    track("result_shown", { deadlines: s.deadlines, exams: s.exams, clash: !!s.clash });
    // Once, for what was imported when the screen opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rows = [
    s.first ? { label: "Next due", value: `${s.first.title} · ${relativeDay(today, s.first.date)}` } : null,
    s.busiestWeek && s.busiestWeek.count > 1 ? { label: "Busiest week", value: `${monthDay(s.busiestWeek.start)} · ${s.busiestWeek.count} due` } : null,
    s.exams ? { label: "Exams", value: String(s.exams) } : null,
    s.clash ? { label: "Work overlap", value: `${weekdayLong(s.clash.date)} · ${s.clash.work}` } : null,
  ].filter((r): r is { label: string; value: string } => r !== null);
  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.titleBlock}>
        <T token="displaySm" accessibilityRole="header">{sample ? "Sample week" : "Your deadlines"}</T>
      </View>
      <View style={{ gap: 2 }}>
        <T token="displayXl" tabular>{String(s.deadlines)}</T>
        <T token="callout" color={c.inkSecondary}>
          {s.deadlines === 0 ? "No upcoming deadlines in this plan." : `${s.deadlines === 1 ? "deadline" : "deadlines"}${s.lastDate ? ` through ${monthDay(s.lastDate)}` : ""}`}
        </T>
      </View>
      <View>
        {rows.map((r, i) => (
          <Animated.View key={r.label} layout={layout} entering={enter.staggered(i)} style={[styles.fact, { borderBottomColor: c.line }]}>
            <T token="body" color={c.inkSecondary}>{r.label}</T>
            <T token="body" numberOfLines={1} style={{ flexShrink: 1, textAlign: "right" }}>{r.value}</T>
          </Animated.View>
        ))}
      </View>
      <View style={styles.footer}>
        <Button label="Continue" onPress={onNext} />
      </View>
    </ScrollView>
  );
}

/* ---------- A reminder they choose: our question first, the system prompt only on yes ---------- */

const REMIND = [
  { id: "evening", label: "The night before at 8 pm", patch: { dayBeforeAt: "20:00" } },
  { id: "morning", label: "The day it’s due at 8 am", patch: { morningAt: "08:00", briefingAt: "08:00" } },
] as const;

function RemindStep({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const items = useItemList();
  const setSettings = useStore((s) => s.setSettings);
  const [choice, setChoice] = useState<(typeof REMIND)[number]["id"]>("evening");
  const [asking, setAsking] = useState(false);
  const today = localParts(new Date()).date;
  const first = useMemo(() => termSummary(items, today).first, [items, today]);
  const yes = async () => {
    setAsking(true);
    setSettings({ remindersAsked: true });
    const granted = await requestNotifications().catch(() => false);
    track("remind_choice", { time: choice, granted });
    if (granted) {
      const picked = REMIND.find((r) => r.id === choice)!;
      setSettings({ reminders: { ...useStore.getState().settings.reminders, enabled: true, briefing: true, ...picked.patch } });
      await syncReminders().catch(() => {});
    }
    setAsking(false);
    onDone();
  };
  const notNow = () => {
    setSettings({ remindersAsked: true });
    track("remind_choice", { time: "none", granted: false });
    onDone();
  };
  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.titleBlock}>
        <T token="displaySm" accessibilityRole="header">When would you like a reminder?</T>
        <T token="callout" color={c.inkSecondary}>
          {first ? `Next due: ${first.title}, ${relativeDay(today, first.date).toLowerCase()}. Change the times in You → Reminders.` : "Get reminders before deadlines. Change the times in You → Reminders."}
        </T>
      </View>
      <View accessibilityRole="radiogroup">
        {REMIND.map((r) => (
          <Press key={r.id} haptic="select" scale={1} accessibilityRole="radio" accessibilityState={{ selected: choice === r.id }} onPress={() => setChoice(r.id)}
            style={[styles.choice, { minHeight: 56, borderBottomColor: c.line }]}>
            <T token="body" style={{ flex: 1 }}>{r.label}</T>
            <View style={[styles.radio, choice === r.id ? { backgroundColor: c.inkPrimary } : { borderWidth: 1.5, borderColor: c.controlOutline }]}>
              {choice === r.id ? <View style={[styles.radioDot, { backgroundColor: c.onPrimary }]} /> : null}
            </View>
          </Press>
        ))}
      </View>
      <View style={[styles.footer, { alignItems: "center" }]}>
        <Button label={asking ? "Setting up reminders…" : "Remind me"} disabled={asking} onPress={() => void yes()} />
        <Press haptic="select" accessibilityRole="button" disabled={asking} onPress={notNow} style={{ minHeight: 44, justifyContent: "center" }}>
          <T token="subhead" color={c.inkSecondary}>Not now</T>
        </Press>
      </View>
    </ScrollView>
  );
}

/* ---------- Plus, after the value moment, in their own words ---------- */

function PlusStep({ onFinish }: { onFinish: () => void }) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const items = useItemList();
  const courses = useCourseList();
  const canvas = useStore((s) => !!s.settings.canvas.feedUrl);
  const headline = useMemo(() => {
    const week = weekOf(localParts(new Date()).date);
    const shifts = items.filter((i) => i.category === "work" && i.kind === "event" && week.includes(i.date)).length;
    const classes = courses.length;
    const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
    if (canvas) return "Keep Canvas in sync with Plus.";
    if (classes && shifts) return `Import class and work schedules without limits.`;
    if (classes) return `Unlimited imports for your ${n(classes, "class", "classes")}.`;
    if (shifts) return `Compare changes to your ${n(shifts, "shift", "shifts")} this week.`;
    return undefined;
  }, [items, courses, canvas]);
  useEffect(() => {
    track("paywall_shown", { reason: "onboarding", personalized: !!headline });
    // Once per visit to the step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const continueFree = () => {
    track("paywall_continue_free", { reason: "onboarding" });
    onFinish();
  };
  return (
    <ScrollView ref={scroll} contentContainerStyle={[styles.page, { paddingTop: 150 }]} showsVerticalScrollIndicator={false}>
      <PlanPicker palette={palettes.dark} headline={headline} onContinueFree={continueFree} onComplete={onFinish} onWelcome={() => scroll.current?.scrollTo({ y: 0, animated: false })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: SCREEN_GUTTER },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 24, minHeight: 36 },
  back: { marginLeft: -8, alignItems: "center", justifyContent: "center" },
  progress: { flex: 1, flexDirection: "row", gap: 5 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  page: { flexGrow: 1, gap: 24 },
  titleBlock: { gap: 6 },
  footer: { marginTop: "auto", paddingTop: 24, gap: 8, alignSelf: "stretch" },
  choice: { flexDirection: "row", alignItems: "center", gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  radio: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 7, height: 7, borderRadius: 4 },
  fact: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth },
  input: { height: 52, borderRadius: 999, paddingHorizontal: 20 },
  status: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
});
