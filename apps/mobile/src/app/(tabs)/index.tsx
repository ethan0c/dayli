import { addDays, conflictIds, diffDays, findConflicts, findOverloads, formatTime, monthDay, pendingDates, relativeDay, weekdayLong } from '@dayli/core';
import type { Item } from '@dayli/schema';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { ItemRow } from '@/components/ItemRow';
import { T } from '@/components/Text';
import { useNow } from '@/lib/now';
import { useItemList, useStore } from '@/store';
import { SAMPLE_SOURCE } from '@/store/sample';
import { NAV_INSET, dayTint, radius, useTheme } from '@/theme';

export default function TodayScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const items = useItemList();
  const name = useStore((s) => s.settings.name);
  const schedules = useStore((s) => s.schedules);
  const toggleDone = useStore((s) => s.toggleDone);

  const todays = useMemo(() => {
    const list = items.filter((i) => i.date === now.date);
    const timed = list.filter((i) => i.start).sort((a, b) => a.start!.localeCompare(b.start!));
    const untimed = list.filter((i) => !i.start);
    return [...timed, ...untimed].sort((a, b) => Number(a.done) - Number(b.done));
  }, [items, now.date]);

  const upcoming = useMemo(
    () =>
      items.filter((i) => !i.done && i.isDeadline && i.date > now.date && diffDays(now.date, i.date) <= 14).slice(0, 5),
    [items, now.date],
  );

  const weekAhead = useMemo(() => items.filter((i) => i.date >= now.date && diffDays(now.date, i.date) <= 7), [items, now.date]);
  const conflicts = useMemo(() => findConflicts(weekAhead), [weekAhead]);
  const conflictSet = useMemo(() => conflictIds(weekAhead), [weekAhead]);
  const overloads = useMemo(() => findOverloads(weekAhead, now), [weekAhead, now]);
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])) as Record<string, Item>, [items]);

  const nextWeekPending = schedules.length > 0 && pendingDates(schedules, addDays(now.date, 1), addDays(now.date, 7)).length > 0;
  const isSample = items.some((i) => i.sourceId === SAMPLE_SOURCE);
  const left = todays.filter((i) => !i.done).length;
  const hasTimed = todays.some((i) => i.start);
  const hour = Number(now.time.slice(0, 2));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={{ backgroundColor: c.canvas }}
      contentContainerStyle={{ paddingBottom: NAV_INSET }}>
      <View style={[styles.head, { backgroundColor: dayTint(c, hour), paddingTop: insets.top + 8 }]}>
        <View style={styles.headRow}>
          <T token="display" style={{ flex: 1 }}>
            {greeting}
            {name ? `,\n${name}.` : '.'}
          </T>
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityLabel="You"
            style={[styles.avatar, { backgroundColor: c.surface }]}>
            <Icon name="user" size={18} color={c.inkPrimary} />
          </Pressable>
        </View>
        <T token="callout" color={c.inkSecondary}>
          {weekdayLong(now.date)}, {monthDay(now.date)} · {left === 0 ? 'nothing left today' : `${left} ${left === 1 ? 'thing' : 'things'} today`}
        </T>
      </View>

      {isSample ? (
        <Pressable onPress={() => router.push('/settings')} style={[styles.note, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
          <Icon name="sparkle" size={16} color={c.accentInk} />
          <T token="subhead" color={c.accentInk} style={{ flex: 1 }}>
            You’re exploring a sample week. Tap + to add your own plans, or open You to clear the sample.
          </T>
        </Pressable>
      ) : null}

      {(conflicts.length > 0 || overloads.length > 0) && (
        <Section title="Heads up">
          {conflicts.slice(0, 3).map((cf) => (
            <Card key={cf.a + cf.b} icon="alert" tone="conflict">
              <T token="body">
                {byId[cf.a]?.title} overlaps {byId[cf.b]?.title} on {monthDay(byId[cf.a]?.date ?? now.date)}.
              </T>
            </Card>
          ))}
          {overloads.slice(0, 2).map((o) => (
            <Card key={o.deadlineId} icon="sparkle" tone="accent" action={{ label: 'Open Plan', onPress: () => router.push('/plan') }}>
              <T token="body">
                You have about {o.freeHours} free {o.freeHours === 1 ? 'hour' : 'hours'} before {byId[o.deadlineId]?.title}. Want to look at the week?
              </T>
            </Card>
          ))}
        </Section>
      )}

      <Section title="Today">
        {todays.length === 0 ? (
          <Empty text="Nothing planned for today yet. Tap + to add a schedule, a syllabus, or a quick message." />
        ) : (
          todays.map((it) => (
            <View key={it.id} style={styles.tl}>
              {hasTimed ? (
                <T token="subhead" color={c.inkSecondary} tabular style={styles.tlTime}>
                  {it.start ? formatTime(it.start) : ''}
                </T>
              ) : null}
              <View style={{ flex: 1, minWidth: 0 }}>
                <ItemRow
                  item={it}
                  conflict={conflictSet.has(it.id)}
                  onPress={() => router.push(`/item/${it.id}`)}
                  onToggle={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleDone(it.id);
                  }}
                />
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="Coming up">
        {upcoming.map((it) => (
          <Pressable key={it.id} onPress={() => router.push(`/item/${it.id}`)} style={[styles.up, { backgroundColor: c.row }]}>
            <Icon name={it.icon} size={18} color={c.inkPrimary} />
            <T style={{ flex: 1 }} numberOfLines={1}>
              {it.title}
            </T>
            <T token="subhead" color={diffDays(now.date, it.date) <= 1 ? c.conflict : c.inkSecondary}>
              {weekdayLong(it.date).slice(0, 3)} · {relativeDay(now.date, it.date)}
            </T>
          </Pressable>
        ))}
        {nextWeekPending ? (
          <Pressable onPress={() => router.push('/capture')} style={[styles.up, styles.pending, { borderColor: c.line }]}>
            <Icon name="work" size={18} color={c.inkSecondary} />
            <T style={{ flex: 1 }} color={c.inkSecondary}>
              {"Next week's shifts"}
            </T>
            <T token="subhead" color={c.inkSecondary}>
              Not added yet
            </T>
          </Pressable>
        ) : null}
        {upcoming.length === 0 && !nextWeekPending ? <Empty text="No deadlines in the next two weeks." /> : null}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.section}>
      <T token="overline" color={c.inkSecondary} style={{ paddingHorizontal: 4 }}>
        {title}
      </T>
      {children}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <T token="callout" color={c.inkSecondary} style={{ paddingHorizontal: 4, paddingVertical: 6 }}>
      {text}
    </T>
  );
}

function Card({
  icon,
  tone,
  action,
  children,
}: {
  icon: 'alert' | 'sparkle';
  tone: 'conflict' | 'accent';
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  const bg = tone === 'conflict' ? c.conflictBg : c.accentSoft;
  const ink = tone === 'conflict' ? c.conflict : c.accentInk;
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={styles.cardRow}>
        <Icon name={icon} size={18} color={ink} />
        <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      </View>
      {action ? (
        <Pressable onPress={action.onPress} style={[styles.cardBtn, { backgroundColor: c.inkPrimary }]}>
          <T token="subhead" color={c.canvas}>
            {action.label}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  note: { marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: radius.row, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  section: { paddingHorizontal: 16, paddingTop: 20, gap: 8 },
  tl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tlTime: { width: 58 },
  up: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: radius.row },
  pending: { borderWidth: 1, borderStyle: 'dashed' },
  card: { borderRadius: radius.card, padding: 14, gap: 10 },
  cardRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill },
});
