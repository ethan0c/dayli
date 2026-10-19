import { Image, StyleSheet, View } from 'react-native';

const STEPS = 28;

/**
 * A full-bleed photo at the top of a screen that fades into the page color, for moment days.
 * The fade is stacked strips so no native gradient module is needed.
 */
export function PhotoHeader({ source, height, to, fadeFrom = 0.45, dim = 0 }: { source: number; height: number; to: string; fadeFrom?: number; dim?: number }) {
  const top = height * fadeFrom;
  return (
    <View pointerEvents="none" style={[styles.wrap, { height }]}>
      <Image source={source} resizeMode="cover" style={{ width: '100%', height }} accessibilityIgnoresInvertColors />
      {dim > 0 ? <View style={[StyleSheet.absoluteFill, { backgroundColor: to, opacity: dim }]} /> : null}
      <View style={{ position: 'absolute', left: 0, right: 0, top, height: height - top }}>
        {Array.from({ length: STEPS }, (_, i) => {
          const t = (i + 1) / STEPS;
          return <View key={i} style={{ flex: 1, backgroundColor: to, opacity: Math.min(1, Math.pow(t, 1.3)) }} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
});
