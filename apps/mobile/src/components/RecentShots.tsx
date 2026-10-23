import { AssetField, MediaSubtype, MediaType, Query, getPermissionsAsync } from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GroupLabel, TextButton } from '@/components/Controls';
import { Press } from '@/components/Press';
import { SkeletonShots } from '@/components/Skeleton';
import { T } from '@/components/Text';
import { reportError } from '@/lib/errors';
import { enter, exit } from '@/lib/motion';
import { corner, radius, useTheme, fade, space } from '@/theme';

type Shot = { id: string; uri: string };

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
  const [notice, setNotice] = useState<string | null>(null);

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
    } catch (error) {
      reportError('photos.recent_screenshots', error);
      setNotice('We couldn’t load recent screenshots. Choose All photos to pick one.');
      setShots([]);
    }
  }

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void getPermissionsAsync(false, ['photo']).then((p) => {
      const ok = usable(p);
      setAllowed(ok);
      if (ok) void load();
    }).catch((error: unknown) => { reportError('photos.check_permission', error); setNotice('We couldn’t check photo access. Choose All photos to try again.'); setAllowed(false); });
  }, []);

  if (Platform.OS === 'web') return null;
  const loading = allowed === null || (allowed && shots === null);
  const list = allowed ? shots ?? [] : [];

  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.head}>
        <GroupLabel>Recent screenshots</GroupLabel>
        <TextButton label="All photos" tone="muted" disabled={disabled} onPress={() => onPick('')} />
      </View>
      {loading || list.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip} style={styles.stripWrap}>
        {/* The placeholders fade out where the shots fade in. */}
        {loading ? <Animated.View key="loading" exiting={exit.fade}><SkeletonShots /></Animated.View> : list.map((s) => (
          <Animated.View key={s.id} entering={enter.fade}>
            <Press accessibilityRole="button" accessibilityLabel="Use this screenshot" haptic="tap" disabled={disabled} onPress={() => onPick(s.uri)} style={[styles.shot, { backgroundColor: c.row, opacity: disabled ? fade.disabled : 1 }]}>
              <Image source={{ uri: s.uri }} style={styles.img} accessibilityIgnoresInvertColors />
            </Press>
          </Animated.View>
        ))}
      </ScrollView> : !notice ? <T token="caption" color={c.inkSecondary}>{allowed ? 'No recent screenshots. Choose All photos to pick a photo or screenshot.' : 'Choose All photos to select a screenshot to import.'}</T> : null}
      {notice ? <T token="caption" color={c.inkSecondary} accessibilityRole="alert">{notice}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stripWrap: { marginHorizontal: -space.xl },
  strip: { paddingHorizontal: space.xl, gap: space.xs },
  shot: { width: 104, height: 150, ...corner(radius.field), overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
});
