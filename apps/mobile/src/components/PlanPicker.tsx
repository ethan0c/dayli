import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { NativeToggle } from '@/components/Native';
import { T } from '@/components/Text';
import { PLANS, money, perMonth } from '@/lib/plans';
import type { PlanId } from '@/store';
import { radius, useTheme } from '@/theme';

type Props = {
  student: boolean;
  onStudent: (v: boolean) => void;
  plan: PlanId | null;
  onPlan: (p: PlanId | null) => void;
};

/** The honor-system student toggle and the three Plus plans. Used in onboarding and in You → Your plan. */
export function PlanPicker({ student, onStudent, plan, onPlan }: Props) {
  const { c } = useTheme();
  const tints = [c.tint.sky, c.tint.lavender, c.tint.mint];
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.studentRow, { backgroundColor: student ? c.accentSoft : c.row, borderColor: student ? c.accentBorder : 'transparent' }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <T token="headline">{"I'm a college student"}</T>
          <T token="caption" color={c.inkSecondary}>
            {"We don't check IDs or .edu emails. We trust you. If you're not a student anymore, switch this off and pay the regular price."}
          </T>
        </View>
        <NativeToggle
          value={student}
          onChange={(v) => {
            Haptics.selectionAsync();
            onStudent(v);
          }}
        />
      </View>

      <View style={{ gap: 8 }}>
        {PLANS.map((p, i) => {
          const on = plan === p.id;
          const price = student ? p.student : p.regular;
          const tint = tints[i]!;
          return (
            <Pressable
              key={p.id}
              onPress={() => {
                Haptics.selectionAsync();
                onPlan(on ? null : p.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[styles.plan, { backgroundColor: on ? tint.fill : c.row, borderColor: on ? tint.ink : 'transparent' }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <T token="headline" color={on ? tint.ink : c.inkPrimary}>
                    {p.name}
                  </T>
                  {p.tag ? (
                    <View style={[styles.tag, { backgroundColor: on ? c.chip : tint.fill }]}>
                      <T token="caption" color={tint.ink}>
                        {p.tag}
                      </T>
                    </View>
                  ) : null}
                </View>
                <T token="caption" color={on ? tint.ink : c.inkSecondary}>
                  {perMonth(p, student)}
                  {student ? ` · regular ${money(p.regular)}` : ''}
                </T>
              </View>
              <T token="title" color={on ? tint.ink : c.inkPrimary} tabular>
                {money(price)}
              </T>
              <T token="caption" color={on ? tint.ink : c.inkSecondary}>
                /{p.period}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, borderWidth: 1 },
  plan: { flexDirection: 'row', alignItems: 'baseline', gap: 6, padding: 14, borderRadius: radius.card, borderWidth: 1.5 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
});
