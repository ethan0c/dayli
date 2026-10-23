import type { NativeStackHeaderProps } from 'expo-router';
import { useLingui } from '@lingui/react/macro';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { T } from '@/components/Text';
import { COLUMN, frameStyle, useWebLayout } from '@/lib/layout';
import { SCREEN_GUTTER, useTheme, space } from '@/theme';

/** What `navigationButtonOptions` hands the desktop header: whether the screen closes or goes back, and how. */
type WebBack = { kind: 'close' | 'back'; onPress: () => void };

/**
 * The header for a wide web window, in desktop form: a small "‹ Back" (or "✕ Close") link above a
 * left-aligned title, both over the screen's column, with any trailing control at the title's right.
 * The stock web header ran the full width with the button at the window's edge. `frame` lines it up
 * with the app's frame (beside the sidebar); `column` and `narrow` centre it over a 720 or 440 column.
 */
export function columnHeader(kind: 'frame' | 'column' | 'narrow') {
  // The navigator calls `header` as a plain function, so it returns an element rather than using hooks itself.
  return function header(props: NativeStackHeaderProps) {
    return <ColumnHeader kind={kind} {...props} />;
  };
}

function ColumnHeader({ kind, options, back, route }: NativeStackHeaderProps & { kind: 'frame' | 'column' | 'narrow' }) {
  const { t } = useLingui();
  const { c } = useTheme();
  const { twoPane } = useWebLayout();
  const tint = typeof options.headerTintColor === 'string' ? options.headerTintColor : c.inkPrimary;
  const right = options.headerRight?.({ canGoBack: !!back, tintColor: tint });
  const title = typeof options.title === 'string' ? options.title : route.name;
  const transparent = options.headerTransparent === true;
  const web = (options as { webBack?: WebBack }).webBack;
  const close = web?.kind === 'close';
  // A screen's own title names the way back; a route group like "(tabs)" or a bare route name never does.
  const named = back?.title && !back.title.startsWith('(') && back.title !== route.name && !back.title.includes('/') ? back.title : null;
  const label = close ? t`Close` : named ?? t`Back`;
  return (
    <View style={[styles.bar, transparent ? styles.over : { backgroundColor: c.canvas }]}>
      <View style={kind === 'frame' ? frameStyle(twoPane) : kind === 'narrow' ? styles.narrow : styles.column}>
        <View style={styles.inner}>
          {web ? (
            <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={web.onPress} hitSlop={8}
              style={(state) => [styles.link, { opacity: (state as { hovered?: boolean }).hovered ? 0.7 : 1 }]}>
              <Icon name={close ? 'x' : 'chevronLeft'} size={15} color={transparent ? tint : c.inkSecondary} />
              <T token="subhead" color={transparent ? tint : c.inkSecondary}>{label}</T>
            </Pressable>
          ) : null}
          {/* Sign-in forms carry their own heading, so their header is only the way back. */}
          {title && kind !== 'narrow' ? (
            <View style={styles.titleRow}>
              <T token="title" color={tint} numberOfLines={1} style={styles.title} accessibilityRole="header">{title}</T>
              {right}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingTop: space.xl, paddingBottom: space.snug },
  over: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, backgroundColor: 'transparent' },
  column: { width: '100%', maxWidth: COLUMN, alignSelf: 'center' },
  narrow: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  // The gutter matches the screens', so the link and the title start at the content's left edge.
  inner: { paddingHorizontal: SCREEN_GUTTER, gap: space.snug, alignItems: 'flex-start' },
  link: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'stretch' },
  title: { flex: 1, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
});
