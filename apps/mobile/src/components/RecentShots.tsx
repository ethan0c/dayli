import { AssetField, MediaSubtype, MediaType, Query, getPermissionsAsync } from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { GroupLabel, TextButton } from '@/components/Controls';
import { Press } from '@/components/Press';
import { SkeletonShots } from '@/components/Skeleton';
import { useTheme } from '@/theme';

type Shot = { id: string; uri: string; sample?: number };

/** Stand-ins shown until the person grants photo access or has screenshots; tapping one opens the picker. */
const SAMPLES: Shot[] = [
  { id: 's1', uri: '', sample: require('../../assets/showcase/demo.jpg') },
  { id: 's2', uri: '', sample: require('../../assets/showcase/headsup.jpg') },
  { id: 's3', uri: '', sample: require('../../assets/showcase/plus.jpg') },
];

/** iOS reports limited access separately from `granted`. */
const usable = (p: { granted: boolean; accessPrivileges?: 'all' | 'limited' | 'none' }) => p.granted || p.accessPrivileges === 'limited';

/**
 * The person's most recent screenshots, because that is where most schedules live.
 * Asks for photo access only when they tap to see them; limited access is enough.
 */
export function RecentShots({ onPick, disabled }: { onPick: (uri: string) => void; disabled?: boolean }) {
  const { c } = useTheme();
  const [shots, setShots] = useState<Shot[] | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  async function load() {
    try {
      const assets = await new Query()
        .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
        .contains(AssetField.MEDIA_SUBTYPES, MediaSubtype.SCREENSHOT)
        .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
        .limit(8)
        .exe();
      const uris = await Promise.all(assets.map(async (a) => ({ id: a.id, uri: await a.getUri() })));
      setShots(uris);
    } catch {
      setShots([]);
    }
  }

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void getPermissionsAsync(false, ['photo']).then((p) => {
      const ok = usable(p);
      setAllowed(ok);
      if (ok) void load();
    }).catch(() => setAllowed(false));
  }, []);

  if (Platform.OS === 'web') return null;
  const loading = allowed === null || (allowed && shots === null);
  const list = allowed && shots && shots.length ? shots : SAMPLES;

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.head}>
        <GroupLabel>Recent screenshots</GroupLabel>
        <TextButton label="All photos" tone="muted" onPress={() => onPick('')} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip} style={styles.stripWrap}>
        {loading ? <SkeletonShots /> : list.map((s) => (
          <Press key={s.id} accessibilityRole="button" accessibilityLabel={s.sample ? 'Choose a screenshot' : 'Use this screenshot'} haptic="tap" disabled={disabled} onPress={() => onPick(s.uri)} scale={0.96} style={[styles.shot, { backgroundColor: c.row, opacity: disabled ? 0.5 : 1 }]}>
            <Image source={s.sample ?? { uri: s.uri }} style={styles.img} accessibilityIgnoresInvertColors />
          </Press>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stripWrap: { marginHorizontal: -24 },
  strip: { paddingHorizontal: 24, gap: 8 },
  shot: { width: 104, height: 150, borderRadius: 14, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
});
